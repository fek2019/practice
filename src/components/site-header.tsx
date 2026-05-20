"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  getSession,
  loginWithEmail,
  registerWithEmail,
  requestEmailCode,
} from "@/lib/auth-client";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

type AuthIntent = "login" | "register";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const validateEmailField = (value: string) => {
  if (!value.trim()) return "Введите email";
  if (!EMAIL_RE.test(value.trim())) return "Email должен быть в формате ***@***.***";
  return "";
};

const roleRoute = {
  client: "/account/client",
  master: "/account/master",
  admin: "/admin"
} as const;

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/services", label: "Услуги" },
  { href: "/masters", label: "Мастера" },
  { href: "/booking", label: "Запись онлайн" },
  { href: "/account", label: "Кабинет" },
  { href: "/contacts", label: "Контакты" }
];

function HeaderAccountDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [intent, setIntent] = useState<AuthIntent>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("client123");
  const [emailCode, setEmailCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const run = async (
    action: () => Promise<{ debugCode?: string; success?: boolean } | { role: keyof typeof roleRoute }>,
    successText: string
  ) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      if ("debugCode" in result && result.debugCode) {
        setEmailCode(result.debugCode);
        setMessage(`${successText} Код заглушки: ${result.debugCode}.`);
        return;
      }
      const session = getSession();
      if (session) {
        onClose();
        router.push(roleRoute[session.role]);
      } else {
        setMessage(successText);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Не удалось выполнить действие.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateEmailField(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }
    setEmailError("");
    run(
      () => (intent === "login" ? loginWithEmail(email, password, emailCode) : registerWithEmail(email, password, emailCode)),
      intent === "login" ? "Вход выполнен." : "Регистрация выполнена."
    );
  };

  return (
    <div className="header-account-dropdown">
      <div className="header-account-head">
        <div>
          <span className="small-badge">Личный кабинет</span>
          <h3>{intent === "login" ? "Вход" : "Регистрация"}</h3>
        </div>
        <button type="button" className="account-dropdown-close" onClick={onClose} aria-label="Закрыть">
          x
        </button>
      </div>

      <div className="auth-method-switch">
        <button
          type="button"
          className={`auth-method-btn ${intent === "login" ? "active" : ""}`}
          onClick={() => {
            setIntent("login");
            setError("");
            setMessage("");
          }}
        >
          Вход
        </button>
        <button
          type="button"
          className={`auth-method-btn ${intent === "register" ? "active" : ""}`}
          onClick={() => {
            setIntent("register");
            setError("");
            setMessage("");
          }}
        >
          Регистрация
        </button>
      </div>

      <form className="account-panel" onSubmit={handleEmailLogin}>
        <div className="field">
          <label htmlFor="header-account-email">Email</label>
          <input
            id="header-account-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError(validateEmailField(event.target.value));
            }}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "header-account-email-error" : undefined}
          />
          {emailError ? <span id="header-account-email-error" className="field-error">{emailError}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="header-account-password">Пароль</label>
          <input
            id="header-account-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="header-account-email-code">Код из письма</label>
          <input
            id="header-account-email-code"
            value={emailCode}
            onChange={(event) => setEmailCode(event.target.value)}
          />
        </div>
        <div className="actions-row">
          <button
            type="button"
            className="outline-button dark"
            disabled={loading}
            onClick={() => {
              const validationError = validateEmailField(email);
              if (validationError) {
                setEmailError(validationError);
                return;
              }
              setEmailError("");
              run(() => requestEmailCode(email), "Письмо отправлено.");
            }}
          >
            Получить код
          </button>
          <button type="submit" className="cta-button" disabled={loading}>
            {loading ? "Проверяем..." : intent === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </div>
      </form>

      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const handleAccountClick = () => {
    const session = getSession();
    if (session) {
      setOpen(false);
      setAccountOpen(false);
      router.push(roleRoute[session.role]);
      return;
    }
    setOpen(false);
    setAccountOpen((value) => !value);
  };

  useEffect(() => {
    const handleFooterAccountOpen = () => {
      setOpen(true);
      setAccountOpen(true);
    };

    window.addEventListener("watchlab:open-account", handleFooterAccountOpen);
    return () => window.removeEventListener("watchlab:open-account", handleFooterAccountOpen);
  }, []);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" onClick={() => setAccountOpen(false)}>
          <span className="brand-mark">W</span>
          <span className="brand-text">
            <strong>Watch Lab</strong>
            <small>Сеть часовых мастерских</small>
          </span>
        </Link>

        <button
          className={cn("burger-button", open && "is-open")}
          onClick={() => setOpen((value) => !value)}
          aria-label="Открыть меню"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={cn("nav site-nav", open && "nav-open")}>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            if (item.href === "/account") {
              return (
                <div className="account-nav-wrap" key={item.href}>
                  <button
                    type="button"
                    className={cn("nav-link nav-link-button", active && "nav-link-active")}
                    onClick={handleAccountClick}
                    aria-expanded={accountOpen}
                  >
                    {item.label}
                  </button>
                  {accountOpen ? <HeaderAccountDropdown onClose={() => setAccountOpen(false)} /> : null}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-link", active && "nav-link-active")}
                onClick={() => {
                  setOpen(false);
                  setAccountOpen(false);
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            className="header-cta"
            href="/booking"
            onClick={() => {
              setOpen(false);
              setAccountOpen(false);
            }}
          >
            Записаться
          </Link>
          <NotificationBell />
        </nav>
      </div>
    </header>
  );
}
