"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  loginWithEmail,
  loginWithPhone,
  requestEmailCode,
  requestPhoneCode
} from "@/lib/auth-client";

type AuthMode = "email" | "phone";

const roleRoute = {
  client: "/account/client",
  master: "/account/master",
  admin: "/admin"
} as const;

// ─── Client-side format validators ───────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_RE = /^\+?[1-9]\d{6,14}$/;
const normalizePhone = (p: string) => p.replace(/[\s\-()]/g, "");

function validateEmailField(value: string): string | null {
  if (!value.trim()) return "Введите email";
  if (!EMAIL_RE.test(value.trim())) return "Некорректный формат email";
  return null;
}

function validatePhoneField(value: string): string | null {
  const v = normalizePhone(value.trim());
  if (!v) return "Введите номер телефона";
  if (!PHONE_RE.test(v)) return "Некорректный формат номера телефона (пример: +79991234567)";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

export function AccountHub() {
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

  // Field-level validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace(roleRoute[session.role]);
    }
  }, [router]);

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
    const err = validateEmailField(email);
    if (err) { setEmailError(err); return; }
    setEmailError(null);
    run(() => loginWithEmail(email, password, emailCode), "Вход выполнен.");
  };

  const handlePhoneLogin = (event: FormEvent) => {
    event.preventDefault();
    const err = validatePhoneField(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError(null);
    run(() => loginWithPhone(phone, phoneCode), "Вход выполнен.");
  };

  const handleRequestEmailCode = () => {
    const err = validateEmailField(email);
    if (err) { setEmailError(err); return; }
    setEmailError(null);
    run(() => requestEmailCode(email), "Письмо отправлено.");
  };

  const handleRequestPhoneCode = () => {
    const err = validatePhoneField(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError(null);
    run(() => requestPhoneCode(phone), "SMS отправлено.");
  };

  return (
    <div className="account-entry-shell">
      <section className="panel account-entry-intro" data-reveal="up">
        <span className="account-pill">Личный кабинет</span>
        <h1>Войдите, чтобы открыть рабочее пространство</h1>
        <p>
          После подтверждения почты или телефона система сразу переведет вас в кабинет с нужной ролью.
        </p>
      </section>

      <div className="account-modal-backdrop">
        <section className="panel account-login-modal" role="dialog" aria-modal="true" aria-label="Вход в личный кабинет">
          <div className="account-scene-head">
            <h2>Вход</h2>
            <p>Подтвердите email или войдите по номеру телефона.</p>
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
                <label htmlFor="account-email">Email</label>
                <input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError(validateEmailField(event.target.value));
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "account-email-error" : undefined}
                />
                {emailError ? <span id="account-email-error" className="field-error">{emailError}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="account-password">Пароль</label>
                <input
                  id="account-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="account-email-code">Код из письма</label>
                <input id="account-email-code" value={emailCode} onChange={(event) => setEmailCode(event.target.value)} />
              </div>
              <div className="actions-row">
                <button
                  type="button"
                  className="outline-button dark"
                  disabled={loading}
                  onClick={handleRequestEmailCode}
                >
                  Получить код
                </button>
                <button className="cta-button" type="submit" disabled={loading}>
                  {loading ? "Проверяем..." : "Войти"}
                </button>
              </div>
            </form>
          ) : (
            <form className="account-panel" onSubmit={handlePhoneLogin}>
              <div className="field">
                <label htmlFor="account-phone">Телефон</label>
                <input
                  id="account-phone"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setPhoneError(validatePhoneField(event.target.value));
                  }}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? "account-phone-error" : undefined}
                />
                {phoneError ? <span id="account-phone-error" className="field-error">{phoneError}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="account-phone-code">Код из SMS</label>
                <input id="account-phone-code" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} />
              </div>
              <div className="actions-row">
                <button
                  type="button"
                  className="outline-button dark"
                  disabled={loading}
                  onClick={handleRequestPhoneCode}
                >
                  Получить код
                </button>
                <button className="cta-button" type="submit" disabled={loading}>
                  {loading ? "Проверяем..." : "Войти"}
                </button>
              </div>
            </form>
          )}

          {message ? <p className="notice success">{message}</p> : null}
          {error ? <p className="notice error">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}
