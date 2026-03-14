"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate, getStatusLabel } from "@/lib/format";
import { getSession } from "@/lib/stubs/auth";
import { listMasterAppointments, listServices, updateAppointmentStatus } from "@/lib/stubs/api";
import { Appointment, AppointmentStatus, AuthSession, Service } from "@/types";
import { StatusBadge } from "../ui/status-badge";

type CalendarMode = "day" | "week" | "month";

const statusOptions: AppointmentStatus[] = ["pending", "in-progress", "ready", "done"];

const getDateDiffDays = (date: string) => {
  const value = new Date(date);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  return Math.floor((target - start) / (1000 * 60 * 60 * 24));
};

export function MasterDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mode, setMode] = useState<CalendarMode>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSession(getSession());
  }, []);

  const reload = useCallback(async (masterId: string) => {
    const [appointmentData, serviceData] = await Promise.all([listMasterAppointments(masterId), listServices()]);
    setAppointments(appointmentData);
    setServices(serviceData);
  }, []);

  useEffect(() => {
    if (!session?.linkedMasterId) {
      setLoading(false);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      await reload(session.linkedMasterId!);
      setLoading(false);
    };
    loadData();
  }, [session, reload]);

  const filteredForCalendar = useMemo(() => {
    return appointments.filter((appointment) => {
      const diff = getDateDiffDays(appointment.date);
      if (mode === "day") {
        return diff === 0;
      }
      if (mode === "week") {
        return diff >= 0 && diff <= 7;
      }
      return diff >= 0 && diff <= 31;
    });
  }, [appointments, mode]);

  const serviceMap = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);
  const currentOrders = appointments.filter((appointment) => appointment.status !== "done");
  const history = appointments.filter((appointment) => appointment.status === "done");

  const handleStatusChange = async (appointmentId: string, status: AppointmentStatus) => {
    if (!session?.linkedMasterId) {
      return;
    }
    setError("");
    try {
      await updateAppointmentStatus(appointmentId, status);
      await reload(session.linkedMasterId);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Не удалось обновить статус.");
    }
  };

  if (!session || session.role !== "master" || !session.linkedMasterId) {
    return (
      <div className="empty-state">
        Войдите под ролью мастера на странице /account. Для демо доступен пользователь `romanov.master@example.com`.
      </div>
    );
  }

  if (loading) {
    return <p className="hint">Загружаем кабинет мастера...</p>;
  }

  return (
    <div className="panel master-dashboard-shell" data-reveal="up">
      <h2>Личный кабинет мастера</h2>
      <p className="hint" style={{ marginBottom: "0.8rem" }}>
        {session.name} | режим календаря:
      </p>
      <div className="actions-row" style={{ marginBottom: "1rem" }}>
        <button type="button" className={`outline-button dark ${mode === "day" ? "nav-link-active" : ""}`} onClick={() => setMode("day")}>
          День
        </button>
        <button
          type="button"
          className={`outline-button dark ${mode === "week" ? "nav-link-active" : ""}`}
          onClick={() => setMode("week")}
        >
          Неделя
        </button>
        <button
          type="button"
          className={`outline-button dark ${mode === "month" ? "nav-link-active" : ""}`}
          onClick={() => setMode("month")}
        >
          Месяц
        </button>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Календарь записей</h3>
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
                    <td>
                      <StatusBadge status={appointment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Текущие заказы</h3>
          {currentOrders.length === 0 ? (
            <p className="hint">Нет активных заказов.</p>
          ) : (
            <div className="option-list">
              {currentOrders.map((appointment) => (
                <article key={appointment.id} className="panel">
                  <h4>{serviceMap.get(appointment.serviceId)?.name ?? "Услуга"}</h4>
                  <p className="hint">
                    {formatDate(appointment.date)} {appointment.timeSlot} | {appointment.clientName}
                  </p>
                  <div className="field" style={{ marginTop: "0.6rem" }}>
                    <label htmlFor={`status-${appointment.id}`}>Статус заказа</label>
                    <select
                      id={`status-${appointment.id}`}
                      value={appointment.status}
                      onChange={(event) => handleStatusChange(appointment.id, event.target.value as AppointmentStatus)}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>История выполненных</h3>
          {history.length === 0 ? (
            <p className="hint">Завершенных заказов пока нет.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1rem", display: "grid", gap: "0.35rem" }}>
              {history.map((appointment) => (
                <li key={appointment.id}>
                  {formatDate(appointment.date)} {appointment.timeSlot} - {serviceMap.get(appointment.serviceId)?.name ?? "Услуга"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error ? <p className="notice error">{error}</p> : null}
    </div>
  );
}
