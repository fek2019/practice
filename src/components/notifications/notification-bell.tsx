"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { listNotifications, markNotificationsRead } from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";
import { Notification } from "@/types";

const formatNotificationDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const unreadItems = useMemo(() => items.filter((item) => !item.readAt), [items]);
  const hasUnread = unreadItems.length > 0;

  const refresh = useCallback(async () => {
    const session = getSession();
    setHasSession(Boolean(session));
    if (!session) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      setItems(await listNotifications());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();
    const intervalId = window.setInterval(refresh, 30_000);
    const handleSessionChange = () => refresh();

    window.addEventListener("watchlab:session-changed", handleSessionChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("watchlab:session-changed", handleSessionChange);
    };
  }, [refresh]);

  const toggleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen || !hasUnread) {
      return;
    }

    const readAt = new Date().toISOString();
    const ids = unreadItems.map((item) => item.id);
    setItems((current) => current.map((item) => (ids.includes(item.id) ? { ...item, readAt } : item)));
    await markNotificationsRead(ids).catch(() => refresh());
  };

  const popover = open ? (
    <section className="notification-popover" aria-label="Уведомления">
      <div className="notification-popover-head">
        <div>
          <span className="small-badge">Уведомления</span>
          <h3>WatchLab</h3>
        </div>
        <button type="button" className="notification-close" onClick={() => setOpen(false)} aria-label="Закрыть">
          x
        </button>
      </div>

      {!hasSession ? <p className="hint">Войдите в кабинет, чтобы получать уведомления.</p> : null}
      {hasSession && loading && items.length === 0 ? <p className="hint">Загружаем уведомления...</p> : null}
      {hasSession && !loading && items.length === 0 ? <p className="hint">Новых уведомлений пока нет.</p> : null}

      {items.length > 0 ? (
        <div className="notification-list">
          {items.map((item) => (
            <article key={item.id} className={`notification-item ${item.readAt ? "" : "is-unread"}`}>
              <div className="notification-item-top">
                <h4>{item.title}</h4>
                <time dateTime={item.scheduledFor}>{formatNotificationDate(item.scheduledFor)}</time>
              </div>
              <p>{item.message}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  ) : null;

  return (
    <div className="notification-shell">
      <button
        type="button"
        className="notification-bell"
        onClick={toggleOpen}
        aria-label="Открыть уведомления"
        aria-expanded={open}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="notification-bell-icon">
          <path d="M18 9.8c0-3.3-2.1-5.8-5-6.4V2.5a1 1 0 0 0-2 0v.9c-2.9.6-5 3.1-5 6.4v3.5l-1.6 2.4A1.5 1.5 0 0 0 5.7 18h12.6a1.5 1.5 0 0 0 1.3-2.3L18 13.3V9.8Z" />
          <path d="M9.8 19a2.3 2.3 0 0 0 4.4 0" />
        </svg>
        {hasUnread ? <span className="notification-dot" aria-hidden="true" /> : null}
      </button>
      {mounted && popover ? createPortal(popover, document.body) : null}
    </div>
  );
}
