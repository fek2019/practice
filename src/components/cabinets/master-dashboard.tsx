"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, listMasterAppointments, listServices, updateAppointmentStatus, updateProfile } from "@/lib/api-client";
import { getSession, logout } from "@/lib/auth-client";
import { formatDate, getStatusLabel } from "@/lib/format";
import { isAppointmentPast } from "@/lib/time";
import { Appointment, AppointmentStatus, AuthSession, Service, User } from "@/types";
import { LogoutButton } from "../account/logout-button";
import { StatusBadge } from "../ui/status-badge";

type CalendarMode = "day" | "week" | "month";

const statusOptions: AppointmentStatus[] = ["pending", "in-progress", "ready", "done", "cancelled"];

const getDateDiffDays = (date: string) => {
  const value = new Date(date);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  return Math.floor((target - start) / (1000 * 60 * 60 * 24));
};

export function MasterDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "" });
  const [mode, setMode] = useState<CalendarMode>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSession(getSession());
  }, []);

  const reload = useCallback(async (masterId: string) => {
    const [profileData, appointmentData, serviceData] = await Promise.all([
      getProfile(),
      listMasterAppointments(masterId),
      listServices()
    ]);
    setProfile(profileData);
    setAppointments(appointmentData);
    setServices(serviceData);
    setProfileForm({ name: profileData.name, phone: profileData.phone, email: profileData.email });
  }, []);

  useEffect(() => {
    if (!session?.linkedMasterId || session.role !== "master") {
      setLoading(false);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      try {
        await reload(session.linkedMasterId!);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("устарела") || msg.includes("авторизац") || msg.includes("401")) {
          logout();
          router.replace("/account");
          return;
        }
        setError(msg || "Не удалось загрузить данные.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [session, reload, router]);

  const filteredForCalendar = useMemo(() => {
    return appointments.filter((appointment) => {
      const diff = getDateDiffDays(appointment.date);
      if (isAppointmentPast(appointment)) return false;
      if (mode === "day") return diff === 0;
      if (mode === "week") return diff >= 0 && diff <= 7;
      return diff >= 0 && diff <= 31;
    });
  }, [appointments, mode]);

  const serviceMap = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);
  const currentOrders = appointments.filter(
    (appointment) => !["done", "cancelled"].includes(appointment.status) && !isAppointmentPast(appointment)
  );
  const history = appointments.filter(
    (appointment) => ["done", "cancelled"].includes(appointment.status) || isAppointmentPast(appointment)
  );

  const handleStatusChange = async (appointmentId: string, status: AppointmentStatus) => {
    if (!session?.linkedMasterId) return;
    setError("");
    setMessage("");
    try {
      await updateAppointmentStatus(appointmentId, status);
      await reload(session.linkedMasterId);
      setMessage("Статус заявки обновлен.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Не удалось обновить статус.");
    }
  };

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.linkedMasterId) return;
    setError("");
    setMessage("");
    try {
      await updateProfile(profileForm);
      await reload(session.linkedMasterId);
      setMessage("Данные аккаунта обновлены.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Не удалось сохранить профиль.");
    }
  };

  if (!session || session.role !== "master" || !session.linkedMasterId) {
    return <div className="empty-state">Доступ к кабинету мастера выдает только администратор.</div>;
  }

  if (loading || !profile) {
    return <p className="hint">Загружаем кабинет мастера...</p>;
  }

  return (
    <div className="cabinet-shell" data-reveal="up">
      <section className="panel cabinet-profile-card">
        <div className="cabinet-profile-summary">
          <div>
            <span className="small-badge">Профиль мастера</span>
            <h2>{profile.name}</h2>
            <p className="hint">{profile.email || profile.phone}</p>
          </div>
          <LogoutButton />
        </div>
        <form className="form-grid cabinet-profile-form" onSubmit={handleProfileSubmit}>
          <div className="field">
            <label htmlFor="master-name">Имя</label>
            <input id="master-name" value={profileForm.name} onChange={(event) => setProfileForm((state) => ({ ...state, name: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="master-phone">Телефон</label>
            <input id="master-phone" value={profileForm.phone} onChange={(event) => setProfileForm((state) => ({ ...state, phone: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="master-email">Email</label>
            <input id="master-email" value={profileForm.email} onChange={(event) => setProfileForm((state) => ({ ...state, email: event.target.value }))} />
          </div>
          <button className="cta-button" type="submit">Сохранить изменения</button>
        </form>
      </section>

      <section className="card">
        <div className="cabinet-section-head">
          <h3>Календарь записей</h3>
          <div className="actions-row">
            {(["day", "week", "month"] as CalendarMode[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`outline-button dark ${mode === item ? "nav-link-active" : ""}`}
                onClick={() => setMode(item)}
              >
                {item === "day" ? "День" : item === "week" ? "Неделя" : "Месяц"}
              </button>
            ))}
          </div>
        </div>
        {filteredForCalendar.length === 0 ? (
          <p className="hint">На выбранный период записей нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Время</th>
                  <th>Клиент</th>
                  <th>Услуга</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredForCalendar.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{formatDate(appointment.date)}</td>
                    <td>{appointment.timeSlot}</td>
                    <td>{appointment.clientName}</td>
                    <td>{serviceMap.get(appointment.serviceId)?.name ?? "-"}</td>
                    <td><StatusBadge status={appointment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="dashboard-grid cabinet-orders-grid">
        <section className="card">
          <h3>Текущие заказы</h3>
          {currentOrders.length === 0 ? (
            <p className="hint">Нет активных заказов.</p>
          ) : (
            <div className="option-list">
              {currentOrders.map((appointment) => (
                <article key={appointment.id} className="panel order-card">
                  <div className="order-card-head">
                    <div>
                      <h4>{serviceMap.get(appointment.serviceId)?.name ?? "Услуга"}</h4>
                      <p className="hint">{formatDate(appointment.date)} {appointment.timeSlot} | {appointment.clientName}</p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <div className="field">
                    <label htmlFor={`status-${appointment.id}`}>Статус заявки</label>
                    <select
                      id={`status-${appointment.id}`}
                      value={appointment.status}
                      onChange={(event) => handleStatusChange(appointment.id, event.target.value as AppointmentStatus)}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{getStatusLabel(status)}</option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h3>История заказов</h3>
          {history.length === 0 ? (
            <p className="hint">Завершенных заказов пока нет.</p>
          ) : (
            <div className="option-list">
              {history.map((appointment) => (
                <article key={appointment.id} className="panel order-card">
                  <div className="order-card-head">
                    <div>
                      <h4>{serviceMap.get(appointment.serviceId)?.name ?? "Услуга"}</h4>
                      <p className="hint">{formatDate(appointment.date)} {appointment.timeSlot}</p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}
    </div>
  );
}
