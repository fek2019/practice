"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  getSession,
  loginWithEmail,
  loginWithPhone,
  requestEmailCode,
  requestPhoneCode
} from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type AuthMode = "email" | "phone";

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
  const [mode, setMode] = useState<AuthMode>("email");
  const [email, setEmail] = useState("ivan.petrov@example.com");
  const [password, setPassword] = useState("client123");
  const [emailCode, setEmailCode] = useState("2468");
  const [phone, setPhone] = useState("+7 999 123 45 67");
  const [phoneCode, setPhoneCode] = useState("1234");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        if (mode === "email") {
          setEmailCode(result.debugCode);
        } else {
          setPhoneCode(result.debugCode);
        }
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
    run(() => loginWithEmail(email, password, emailCode), "Вход выполнен.");
  };

  const handlePhoneLogin = (event: FormEvent) => {
    event.preventDefault();
    run(() => loginWithPhone(phone, phoneCode), "Вход выполнен.");
  };

  return (
    <div className="header-account-dropdown">
      <div className="header-account-head">
        <div>
          <span className="small-badge">Личный кабинет</span>
          <h3>Вход</h3>
        </div>
        <button type="button" className="account-dropdown-close" onClick={onClose} aria-label="Закрыть">
          x
        </button>
      </div>

      <div className="auth-method-switch">
        <button
          type="button"
          className={`auth-method-btn ${mode === "email" ? "active" : ""}`}
          onClick={() => setMode("email")}
        >
          Email
        </button>
        <button
          type="button"
          className={`auth-method-btn ${mode === "phone" ? "active" : ""}`}
          onClick={() => setMode("phone")}
        >
          Телефон
        </button>
      </div>

      {mode === "email" ? (
        <form className="account-panel" onSubmit={handleEmailLogin}>
          <div className="field">
            <label htmlFor="header-account-email">Email</label>
            <input
              id="header-account-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
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
              onClick={() => run(() => requestEmailCode(email), "Письмо отправлено.")}
            >
              Получить код
            </button>
            <button type="submit" className="cta-button" disabled={loading}>
              {loading ? "Проверяем..." : "Войти"}
            </button>
          </div>
        </form>
      ) : (
        <form className="account-panel" onSubmit={handlePhoneLogin}>
          <div className="field">
            <label htmlFor="header-account-phone">Телефон</label>
            <input id="header-account-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="header-account-phone-code">Код из SMS</label>
            <input
              id="header-account-phone-code"
              value={phoneCode}
              onChange={(event) => setPhoneCode(event.target.value)}
            />
          </div>
          <div className="actions-row">
            <button
              type="button"
              className="outline-button dark"
              disabled={loading}
              onClick={() => run(() => requestPhoneCode(phone), "SMS отправлено.")}
            >
              Получить код
            </button>
            <button type="submit" className="cta-button" disabled={loading}>
              {loading ? "Проверяем..." : "Войти"}
            </button>
          </div>
        </form>
      )}

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
        </nav>
      </div>
    </header>
  );
}
