"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  loginWithEmail,
  requestEmailCode,
  registerWithEmail,
} from "@/lib/auth-client";

type AuthIntent = "login" | "register";

const roleRoute = {
  client: "/account/client",
  master: "/account/master",
  admin: "/admin",
} as const;

// ─── Client-side format validators ───────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function validateEmailField(value: string): string | null {
  if (!value.trim()) return "Введите email";
  if (!EMAIL_RE.test(value.trim())) return "Email должен быть в формате ***@***.***";
  return null;
}

// ─── Resend-code cooldown hook ────────────────────────────────────────────────

function useCooldown(seconds = 60) {
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setRemaining(seconds);
    timer.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return { remaining, start };
}

// ─────────────────────────────────────────────────────────────────────────────

export function AccountHub() {
  const router = useRouter();

  const [intent, setIntent] = useState<AuthIntent>("login");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("client123");
  const [emailCode, setEmailCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Shared UI state
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Field-level validation errors
  const [emailError, setEmailError] = useState<string | null>(null);

  // Cooldown timers so users can't spam "Получить код"
  const emailCooldown = useCooldown(60);

  // Redirect if already logged in
  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace(roleRoute[session.role]);
    }
  }, [router]);

  // ─── Generic async runner ─────────────────────────────────────────────────

  const run = async <T,>(
    action: () => Promise<T>,
    onSuccess: (result: T) => void
  ) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      onSuccess(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось выполнить действие."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Email handlers ───────────────────────────────────────────────────────

  const handleRequestEmailCode = () => {
    const err = validateEmailField(email);
    if (err) { setEmailError(err); return; }
    setEmailError(null);

    run(
      () => requestEmailCode(email),
      (result) => {
        setEmailSent(true);
        emailCooldown.start();
        if (result.debugCode) {
          setEmailCode(result.debugCode);
          setMessage(`Письмо отправлено (dev-код: ${result.debugCode}).`);
        } else {
          setMessage("Письмо отправлено. Проверьте почту.");
        }
      }
    );
  };

  const handleEmailLogin = (event: FormEvent) => {
    event.preventDefault();
    const err = validateEmailField(email);
    if (err) { setEmailError(err); return; }
    setEmailError(null);

    run(
      () => (intent === "login" ? loginWithEmail(email, password, emailCode) : registerWithEmail(email, password, emailCode)),
      () => {
        const session = getSession();
        if (session) router.push(roleRoute[session.role]);
        else setMessage(intent === "login" ? "Вход выполнен." : "Регистрация выполнена.");
      }
    );
  };

  // ─── Switch mode ──────────────────────────────────────────────────────────

  const switchIntent = (next: AuthIntent) => {
    setIntent(next);
    setError("");
    setMessage("");
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="account-entry-shell">
      <section className="panel account-entry-intro" data-reveal="up">
        <span className="account-pill">Личный кабинет</span>
        <h1>Войдите, чтобы открыть рабочее пространство</h1>
        <p>
          Войдите по почте или создайте аккаунт. После подтверждения система
          сразу переведёт вас в кабинет.
        </p>
      </section>

      <div className="account-modal-backdrop">
        <section
          className="panel account-login-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Вход в личный кабинет"
        >
          <div className="account-scene-head">
            <h2>{intent === "login" ? "Вход" : "Регистрация"}</h2>
            <p>Подтвердите email кодом из письма.</p>
          </div>

          {/* Tab switcher */}
          <div className="auth-method-switch">
            <button
              type="button"
              className={`auth-method-btn ${intent === "login" ? "active" : ""}`}
              onClick={() => switchIntent("login")}
            >
              Вход
            </button>
            <button
              type="button"
              className={`auth-method-btn ${intent === "register" ? "active" : ""}`}
              onClick={() => switchIntent("register")}
            >
              Регистрация
            </button>
          </div>

          <form className="account-panel" onSubmit={handleEmailLogin}>
              <div className="field">
                <label htmlFor="account-email">Email</label>
                <input
                  id="account-email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(validateEmailField(e.target.value));
                    setEmailSent(false);
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "account-email-error" : undefined}
                />
                {emailError ? (
                  <span id="account-email-error" className="field-error">
                    {emailError}
                  </span>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="account-password">Пароль</label>
                <input
                  id="account-password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="account-email-code">
                  Код из письма
                  {emailSent ? (
                    <span className="field-hint"> — проверьте почту</span>
                  ) : null}
                </label>
                <input
                  id="account-email-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailCode}
                  placeholder="····"
                  onChange={(e) => setEmailCode(e.target.value)}
                />
              </div>

              <div className="actions-row">
                <button
                  type="button"
                  className="outline-button dark"
                  disabled={loading || emailCooldown.remaining > 0}
                  onClick={handleRequestEmailCode}
                >
                  {emailCooldown.remaining > 0
                    ? `Повторить через ${emailCooldown.remaining} с`
                    : "Получить код"}
                </button>
                <button
                  className="cta-button"
                  type="submit"
                  disabled={loading || !emailSent}
                >
                  {loading ? "Проверяем..." : intent === "login" ? "Войти" : "Зарегистрироваться"}
                </button>
              </div>
            </form>

          {message ? <p className="notice success">{message}</p> : null}
          {error ? <p className="notice error">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}
