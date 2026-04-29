"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  getSession,
  loginWithEmail,
  loginWithPhone,
  logout,
  requestPhoneCode,
  switchDemoRole
} from "@/lib/auth-client";
import { AuthSession, UserRole } from "@/types";

type AuthMode = "email" | "phone";

const demoRoles: Array<{ role: UserRole; title: string; text: string; href: string }> = [
  {
    role: "client",
    title: "Клиент",
    text: "История заявок и статусы ремонта.",
    href: "/account/client"
  },
  {
    role: "master",
    title: "Мастер",
    text: "Календарь, текущие заказы и смена статусов.",
    href: "/account/master"
  },
  {
    role: "admin",
    title: "Администратор",
    text: "CRUD, цены, мастера и статистика.",
    href: "/admin"
  }
];

export function AccountHub() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mode, setMode] = useState<AuthMode>("email");
  const [email, setEmail] = useState("admin@watchlab.local");
  const [password, setPassword] = useState("admin123");
  const [phone, setPhone] = useState("+7 999 123 45 67");
  const [code, setCode] = useState("1234");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const run = async (action: () => Promise<AuthSession | { debugCode?: string; success: boolean } | void>, success: string) => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await action();
      setSession(getSession());
      if (result && "debugCode" in result && result.debugCode) {
        setCode(result.debugCode);
        setMessage(`${success} Код для dev-режима: ${result.debugCode}.`);
      } else {
        setMessage(success);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Операция не выполнена.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = (event: FormEvent) => {
    event.preventDefault();
    run(() => loginWithEmail(email, password), "Вход выполнен.");
  };

  const handlePhoneLogin = (event: FormEvent) => {
    event.preventDefault();
    run(() => loginWithPhone(phone, code), "Вход выполнен.");
  };

  const handleLogout = () => {
    logout();
    setSession(null);
    setMessage("Вы вышли из аккаунта.");
    setError("");
  };

  return (
    <div className="account-shell">
      <section className="panel account-hub" data-reveal="up">
        <div className="account-hub-top">
          <div>
            <span className="account-pill">Личный кабинет</span>
            <h1>Вход, роли и рабочие пространства</h1>
            <p>
              Выберите нужную роль, войдите по email или подтвердите телефон, чтобы перейти к рабочему кабинету.
            </p>
          </div>
          <div className="account-kpis">
            <div className="account-kpi">
              <span>Рабочий контур</span>
              <strong>готов</strong>
            </div>
            <div className="account-kpi">
              <span>Сессия</span>
              <strong>{session ? session.role : "не активна"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel account-scene" data-reveal="up">
        <div className="account-scene-head">
          <h2>{session ? `Вы вошли как ${session.name}` : "Войти в аккаунт"}</h2>
          <p>{session ? `${session.email || session.phone} | роль: ${session.role}` : "Выберите способ входа."}</p>
        </div>

        {session ? (
          <div className="account-space-grid">
            {demoRoles.map((item) => (
              <article className="card account-space-card" key={item.role}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link className="cta-button small" href={item.href}>
                  Открыть
                </Link>
              </article>
            ))}
            <button type="button" className="outline-button dark" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        ) : (
          <div className="account-auth-layout">
            <div className="account-auth-main">
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
                    <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
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
                  <button className="cta-button" type="submit" disabled={loading}>
                    {loading ? "Входим..." : "Войти"}
                  </button>
                </form>
              ) : (
                <form className="account-panel" onSubmit={handlePhoneLogin}>
                  <div className="field">
                    <label htmlFor="account-phone">Телефон</label>
                    <input id="account-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
                  </div>
                  <div className="actions-row">
                    <button
                      type="button"
                      className="outline-button dark"
                      disabled={loading}
                      onClick={() => run(() => requestPhoneCode(phone), "Код отправлен.")}
                    >
                      Получить код
                    </button>
                  </div>
                  <div className="field">
                    <label htmlFor="account-code">Код</label>
                    <input id="account-code" value={code} onChange={(event) => setCode(event.target.value)} />
                  </div>
                  <button className="cta-button" type="submit" disabled={loading}>
                    {loading ? "Проверяем..." : "Войти по телефону"}
                  </button>
                </form>
              )}
            </div>

            <aside className="account-side-note">
              <h3>Демо-роли</h3>
              <div className="account-role-grid">
                {demoRoles.map((item) => (
                  <button
                    type="button"
                    className="account-role-btn"
                    key={item.role}
                    disabled={loading}
                    onClick={() => run(() => switchDemoRole(item.role), `Включена роль: ${item.title}.`)}
                  >
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <span className="small-badge">{item.role}</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}

        {message ? <p className="notice success">{message}</p> : null}
        {error ? <p className="notice error">{error}</p> : null}
      </section>
    </div>
  );
}
