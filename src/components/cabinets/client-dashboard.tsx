"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createReview,
  getProfile,
  listClientAppointments,
  listClientReviews,
  listMasters,
  listServices,
  updateProfile
} from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import { Appointment, AuthSession, Master, Review, Service, User } from "@/types";
import { StatusBadge } from "../ui/status-badge";

export function ClientDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "" });
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; text: string }>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSession(getSession());
  }, []);

  const reload = async () => {
    const [profileData, appointmentData, reviewData, serviceData, masterData] = await Promise.all([
      getProfile(),
      listClientAppointments(),
      listClientReviews(),
      listServices(),
      listMasters()
    ]);
    setProfile(profileData);
    setAppointments(appointmentData);
    setReviews(reviewData);
    setServices(serviceData);
    setMasters(masterData);
    setProfileForm({
      name: profileData.name,
      phone: profileData.phone,
      email: profileData.email
    });
  };

  useEffect(() => {
    if (!session || session.role !== "client") {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        await reload();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session]);

  const serviceMap = useMemo(() => new Map(services.map((item) => [item.id, item])), [services]);
  const masterMap = useMemo(() => new Map(masters.map((item) => [item.id, item])), [masters]);
  const reviewedAppointmentIds = useMemo(() => new Set(reviews.map((review) => review.appointmentId)), [reviews]);
  const activeOrders = appointments.filter((appointment) => !["done", "cancelled"].includes(appointment.status));
  const history = appointments.filter((appointment) => ["done", "cancelled"].includes(appointment.status));

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await updateProfile(profileForm);
      await reload();
      setMessage("Данные аккаунта обновлены.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Не удалось сохранить профиль.");
    }
  };

  const handleReviewSubmit = async (appointmentId: string) => {
    const draft = reviewDrafts[appointmentId];
    if (!draft?.text.trim()) {
      setError("Напишите текст отзыва.");
      return;
    }
    setError("");
    setMessage("");
    try {
      await createReview({
        appointmentId,
        rating: draft.rating,
        text: draft.text
      });
      await reload();
      setMessage("Отзыв отправлен.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Не удалось отправить отзыв.");
    }
  };

  if (!session) {
    return <div className="empty-state">Сначала войдите через страницу личного кабинета.</div>;
  }

  if (session.role !== "client") {
    return <div className="empty-state">Этот кабинет доступен только клиенту.</div>;
  }

  if (loading || !profile) {
    return <p className="hint">Загружаем кабинет клиента...</p>;
  }

  return (
    <div className="cabinet-shell" data-reveal="up">
      <section className="panel cabinet-profile-card">
        <div>
          <span className="small-badge">Профиль клиента</span>
          <h2>{profile.name}</h2>
          <p className="hint">{profile.email || profile.phone}</p>
        </div>
        <form className="form-grid cabinet-profile-form" onSubmit={handleProfileSubmit}>
          <div className="field">
            <label htmlFor="client-name">Имя</label>
            <input id="client-name" value={profileForm.name} onChange={(event) => setProfileForm((state) => ({ ...state, name: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="client-phone">Телефон</label>
            <input id="client-phone" value={profileForm.phone} onChange={(event) => setProfileForm((state) => ({ ...state, phone: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="client-email">Email</label>
            <input id="client-email" value={profileForm.email} onChange={(event) => setProfileForm((state) => ({ ...state, email: event.target.value }))} />
          </div>
          <button className="cta-button" type="submit">Сохранить изменения</button>
        </form>
      </section>

      <div className="dashboard-grid cabinet-orders-grid">
        <section className="card">
          <h3>Текущие заявки</h3>
          {activeOrders.length === 0 ? (
            <p className="hint">Активных заявок пока нет.</p>
          ) : (
            <div className="option-list">
              {activeOrders.map((appointment) => (
                <article className="panel order-card" key={appointment.id}>
                  <div className="order-card-head">
                    <div>
                      <h4>{serviceMap.get(appointment.serviceId)?.name ?? "Услуга удалена"}</h4>
                      <p className="hint">
                        {formatDate(appointment.date)} в {appointment.timeSlot}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="hint">Мастер: {masterMap.get(appointment.masterId)?.name ?? "Не назначен"}</p>
                  {appointment.status === "ready" ? (
                    reviewedAppointmentIds.has(appointment.id) ? (
                      <p className="notice success">Отзыв уже отправлен.</p>
                    ) : (
                      <div className="review-editor">
                        <div className="field">
                          <label htmlFor={`rating-${appointment.id}`}>Оценка мастеру</label>
                          <select
                            id={`rating-${appointment.id}`}
                            value={reviewDrafts[appointment.id]?.rating ?? 5}
                            onChange={(event) =>
                              setReviewDrafts((state) => ({
                                ...state,
                                [appointment.id]: {
                                  rating: Number(event.target.value),
                                  text: state[appointment.id]?.text ?? ""
                                }
                              }))
                            }
                          >
                            {[5, 4, 3, 2, 1].map((rating) => (
                              <option key={rating} value={rating}>
                                {rating}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor={`review-${appointment.id}`}>Отзыв</label>
                          <textarea
                            id={`review-${appointment.id}`}
                            rows={3}
                            value={reviewDrafts[appointment.id]?.text ?? ""}
                            onChange={(event) =>
                              setReviewDrafts((state) => ({
                                ...state,
                                [appointment.id]: {
                                  rating: state[appointment.id]?.rating ?? 5,
                                  text: event.target.value
                                }
                              }))
                            }
                          />
                        </div>
                        <button className="cta-button small" type="button" onClick={() => handleReviewSubmit(appointment.id)}>
                          Отправить отзыв
                        </button>
                      </div>
                    )
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h3>История заказов</h3>
          {history.length === 0 ? (
            <p className="hint">История пока пуста.</p>
          ) : (
            <div className="option-list">
              {history.map((appointment) => (
                <article className="panel order-card" key={appointment.id}>
                  <div className="order-card-head">
                    <div>
                      <h4>{serviceMap.get(appointment.serviceId)?.name ?? "Услуга удалена"}</h4>
                      <p className="hint">
                        {formatDate(appointment.date)} в {appointment.timeSlot}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="hint">Мастер: {masterMap.get(appointment.masterId)?.name ?? "Не назначен"}</p>
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
