"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/format";
import { getSession } from "@/lib/stubs/auth";
import { listClientAppointments, listMasters, listServices } from "@/lib/stubs/api";
import { Appointment, AuthSession, Master, Service } from "@/types";
import { StatusBadge } from "../ui/status-badge";

const stageOrder = ["pending", "in-progress", "ready", "done"] as const;

export function ClientDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      const [appointmentData, serviceData, masterData] = await Promise.all([
        listClientAppointments({ phone: session.phone, email: session.email }),
        listServices(),
        listMasters()
      ]);
      setAppointments(appointmentData);
      setServices(serviceData);
      setMasters(masterData);
      setLoading(false);
    };
    loadData();
  }, [session]);

  const serviceMap = useMemo(() => new Map(services.map((item) => [item.id, item])), [services]);
  const masterMap = useMemo(() => new Map(masters.map((item) => [item.id, item])), [masters]);

  if (!session) {
    return <div className="empty-state">Войдите в кабинет клиента на странице /account, чтобы увидеть ваши заявки.</div>;
  }

  if (session.role !== "client") {
    return <div className="empty-state">Текущая роль не клиент. Переключите роль в разделе /account.</div>;
  }

  if (loading) {
    return <p className="hint">Загружаем заказы...</p>;
  }

  return (
    <div className="panel client-dashboard-shell" data-reveal="up">
      <h2>Личный кабинет клиента</h2>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        {session.name || "Клиент"} | {session.phone || session.email}
      </p>

      {appointments.length === 0 ? (
        <div className="empty-state">У вас пока нет заявок. Создайте запись через раздел &quot;Запись онлайн&quot;.</div>
      ) : (
        <div className="option-list">
          {appointments.map((appointment) => {
            const service = serviceMap.get(appointment.serviceId);
            const master = masterMap.get(appointment.masterId);
            const currentStage = stageOrder.indexOf(appointment.status);

            return (
              <article className="card" key={appointment.id}>
                <h3>{service?.name ?? "Услуга удалена"}</h3>
                <p className="hint">
                  {formatDate(appointment.date)} в {appointment.timeSlot} | Мастер: {master?.name ?? "не назначен"}
                </p>
                <div style={{ marginTop: "0.6rem" }}>
                  <StatusBadge status={appointment.status} />
                </div>
                <div className="wizard-steps" style={{ marginTop: "0.8rem" }}>
                  {stageOrder.map((stage, index) => (
                    <div
                      key={stage}
                      className={index <= currentStage ? "wizard-step done" : "wizard-step"}
                      style={{ fontSize: "0.7rem" }}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
                {appointment.status === "ready" ? (
                  <div className="notice success" style={{ marginTop: "0.8rem" }}>
                    Часы готовы к выдаче. Забрать можно в день готовности до 19:00.
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
