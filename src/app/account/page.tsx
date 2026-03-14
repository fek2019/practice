"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  DEMO_SMS_CODE,
  getSession,
  loginWithEmail,
  loginWithPhone,
  logout,
  requestPhoneCode,
  switchDemoRole
} from "@/lib/stubs/auth";
import { AuthSession, UserRole } from "@/types";

type AccountStage = "auth" | "demo" | "spaces";
type AuthMethod = "phone" | "email";

const stageLabels: Record<AccountStage, { title: string; subtitle: string }> = {
  auth: {
    title: "Авторизация",
    subtitle: "Вход по телефону (SMS) или email/пароль"
  },
  demo: {
    title: "Роли",
    subtitle: "Переключение режимов клиента, мастера и администратора"
  },
  spaces: {
    title: "Кабинеты",
    subtitle: "Быстрый переход в рабочие разделы"
  }
};

const roleDescriptions: Record<UserRole, string> = {
  client: "История заказов, статусы ремонта, уведомления о готовности.",
  master: "Календарь записей, текущие заявки, обновление статусов.",
  admin: "Управление услугами и мастерами, цены и аналитика."
};

export default function AccountPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [stage, setStage] = useState<AccountStage>("auth");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const stageInfo = useMemo(() => stageLabels[stage], [stage]);
  const sessionLabel = session ? `${session.name || "Пользователь"} (${session.role})` : "Не авторизован";

  const refreshSession = () => setSession(getSession());

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const handlePhoneCodeRequest = async () => {
    clearAlerts();
    try {
      setLoading(true);
      await requestPhoneCode(phone);
      setMessage(`Код отправлен. Для демо используйте ${DEMO_SMS_CODE}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось отправить код.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (event: FormEvent) => {
    event.preventDefault();
    clearAlerts();
    try {
      setLoading(true);
      await loginWithPhone(phone, code);
      refreshSession();
      setMessage("Вход выполнен.");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Ошибка входа.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (event: FormEvent) => {
    event.preventDefault();
    clearAlerts();
    try {
      setLoading(true);
      await loginWithEmail(email, password);
      refreshSession();
      setMessage("Вход выполнен.");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Ошибка входа.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    clearAlerts();
    setLoading(true);
    try {
      await switchDemoRole(role);
      refreshSession();
      setMessage(`Роль "${role}" активирована.`);
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "Не удалось переключить роль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <section className="section account-page-section">
        <div className="container account-shell">
          <article className="panel account-hub" data-reveal="up">
          <div className="account-hub-top">
            <div>
              <span className="account-pill">Центр доступа</span>
              <h1>Личный кабинет Watch Lab</h1>
              <p>
                Одна точка входа для клиента, мастера и администратора. Выберите режим работы ниже и продолжайте в
                нужный кабинет.
              </p>
            </div>
            <div className="account-kpis">
              <article className="account-kpi">
                <span>Текущий режим</span>
                <strong>{session ? session.role : "guest"}</strong>
              </article>
              <article className="account-kpi">
                <span>Сессия</span>
                <strong>{session ? "Активна" : "Нет"}</strong>
              </article>
              <article className="account-kpi">
                <span>Аккаунт</span>
                <strong>{session ? session.name || "Пользователь" : "Не выбран"}</strong>
              </article>
            </div>
          </div>
          <div className="account-tab-row">
            {(Object.keys(stageLabels) as AccountStage[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`account-tab-btn ${stage === item ? "active" : ""}`}
                onClick={() => setStage(item)}
              >
                <strong>{stageLabels[item].title}</strong>
                <small>{stageLabels[item].subtitle}</small>
              </button>
            ))}
          </div>
          </article>

          <article className="panel account-scene" data-reveal="up">
          <header className="account-scene-head">
            <h2>{stageInfo.title}</h2>
            <p>{stageInfo.subtitle}</p>
            <span className="small-badge">{sessionLabel}</span>
          </header>

          {stage === "auth" ? (
            <div className="account-panel account-auth-layout">
              <article className="card account-auth-main">
                <div className="auth-method-switch">
                  <button
                    type="button"
                    className={`auth-method-btn ${authMethod === "phone" ? "active" : ""}`}
                    onClick={() => setAuthMethod("phone")}
                  >
                    Телефон + SMS
                  </button>
                  <button
                    type="button"
                    className={`auth-method-btn ${authMethod === "email" ? "active" : ""}`}
                    onClick={() => setAuthMethod("email")}
                  >
                    Email + пароль
                  </button>
                </div>

                {authMethod === "phone" ? (
                  <form className="form-grid" onSubmit={handlePhoneLogin}>
                    <div className="field">
                      <label htmlFor="phone">Телефон</label>
                      <input
                        id="phone"
                        placeholder="+7 (___) ___-__-__"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                      />
                    </div>
                    <div className="actions-row">
                      <button
                        type="button"
                        className="outline-button dark"
                        onClick={handlePhoneCodeRequest}
                        disabled={loading}
                      >
                        Запросить код
                      </button>
                    </div>
                    <div className="field">
                      <label htmlFor="code">Код подтверждения</label>
                      <input id="code" value={code} onChange={(event) => setCode(event.target.value)} />
                    </div>
                    <button className="cta-button" type="submit" disabled={loading}>
                      Войти по телефону
                    </button>
                  </form>
                ) : (
                  <form className="form-grid" onSubmit={handleEmailLogin}>
                    <div className="field">
                      <label htmlFor="email">Email</label>
                      <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="password">Пароль</label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                    <button className="cta-button" type="submit" disabled={loading}>
                      Войти по email
                    </button>
                    <p className="hint">Админ-доступ: `admin@watchlab.local` / `admin123`</p>
                  </form>
                )}
              </article>

              <aside className="card account-side-note">
                <h3>Порядок работы</h3>
                <ol className="account-steps">
                  <li>Выберите удобный способ входа.</li>
                  <li>Авторизуйтесь и проверьте активную роль.</li>
                  <li>Перейдите в нужный кабинет через вкладку &quot;Кабинеты&quot;.</li>
                </ol>
                {session ? (
                  <div className="notice success">Сессия активна. Можно переходить к рабочим разделам.</div>
                ) : (
                  <div className="notice error">Сессия не активна. Выполните вход, чтобы открыть кабинеты.</div>
                )}
              </aside>
            </div>
          ) : null}

          {stage === "demo" ? (
            <div className="account-panel">
              <div className="account-role-grid">
                {(["client", "master", "admin"] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`account-role-btn ${session?.role === role ? "active" : ""}`}
                    onClick={() => handleRoleSwitch(role)}
                    disabled={loading}
                  >
                    <h3>{role.toUpperCase()}</h3>
                    <p>{roleDescriptions[role]}</p>
                    {session?.role === role ? <span className="small-badge">Активно</span> : null}
                  </button>
                ))}
              </div>

              <div className="actions-row">
                <button
                  type="button"
                  className="outline-button dark"
                  onClick={() => {
                    logout();
                    refreshSession();
                    setMessage("Выход выполнен.");
                  }}
                >
                  Сбросить сессию
                </button>
              </div>
            </div>
          ) : null}

          {stage === "spaces" ? (
            <div className="account-panel">
              <div className="account-space-grid">
                <article className="card account-space-card">
                  <h3>Кабинет клиента</h3>
                  <p>История ремонтов, текущие статусы, напоминания о готовности.</p>
                  <span className="small-badge">/account/client</span>
                  <Link href="/account/client" className="cta-button small">
                    Открыть
                  </Link>
                </article>
                <article className="card account-space-card">
                  <h3>Кабинет мастера</h3>
                  <p>Календарь, текущие заказы, изменение статусов и история работ.</p>
                  <span className="small-badge">/account/master</span>
                  <Link href="/account/master" className="cta-button small">
                    Открыть
                  </Link>
                </article>
                <article className="card account-space-card">
                  <h3>Админ-панель</h3>
                  <p>CRUD по услугам и мастерам, управление ценами и статистика.</p>
                  <span className="small-badge">/admin</span>
                  <Link href="/admin" className="cta-button small">
                    Открыть
                  </Link>
                </article>
              </div>
            </div>
          ) : null}
          </article>

          {message ? <p className="notice success" data-reveal="up">{message}</p> : null}
          {error ? <p className="notice error" data-reveal="up">{error}</p> : null}
          <p className="hint">Логика авторизации пока в `src/lib/stubs/auth.ts` (временные заглушки).</p>
        </div>
      </section>
    </div>
  );
}
