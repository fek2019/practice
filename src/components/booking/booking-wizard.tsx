"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createAppointment, getAvailableSlots, listMasters, listServices } from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { getTodayDate } from "@/lib/time";
import { Appointment, AuthSession, Master, Service } from "@/types";

const steps = ["Услуга", "Мастер", "Дата и время", "Контакты", "Подтверждение"];
const BOOKING_PROGRESS_EVENT = "booking-wizard:progress";
const BOOKING_PHONE_RE = /^\+7\d{10}$/;
const SLOT_SEARCH_DAYS = 60;

const normalizeBookingPhone = (value: string) => value.replace(/[\s\-()]/g, "");

const isValidBookingPhone = (value: string) => BOOKING_PHONE_RE.test(normalizeBookingPhone(value));

const addDaysToDateInput = (value: string, days: number) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

export function BookingWizard() {
  const searchParams = useSearchParams();
  const queryServiceId = searchParams.get("serviceId");
  const queryMasterId = searchParams.get("masterId");
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dateNotice, setDateNotice] = useState("");
  const [success, setSuccess] = useState<Appointment | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  const [serviceId, setServiceId] = useState("");
  const [masterId, setMasterId] = useState("any");
  const [date, setDate] = useState(getTodayDate());
  const [timeSlot, setTimeSlot] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    setClientName((value) => value || session.name);
    setClientPhone((value) => value || session.phone);
    setClientEmail(session.email);
  }, [session]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      const [serviceData, masterData] = await Promise.all([listServices(), listMasters(true)]);
      setServices(serviceData);
      setMasters(masterData);

      setServiceId(queryServiceId ?? serviceData[0]?.id ?? "");
      setMasterId(queryMasterId ?? "any");
      setLoading(false);
    };
    bootstrap();
  }, [queryMasterId, queryServiceId]);

  useEffect(() => {
    if (!date) {
      return;
    }
    let ignore = false;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setDateNotice((current) => (current.includes(formatDate(date)) ? current : ""));

      for (let dayOffset = 0; dayOffset <= SLOT_SEARCH_DAYS; dayOffset += 1) {
        const candidateDate = addDaysToDateInput(date, dayOffset);
        const available = await getAvailableSlots(candidateDate, masterId === "any" ? null : masterId);
        if (ignore) {
          return;
        }

        if (available.length > 0) {
          setSlots(available);
          setTimeSlot((current) => (current && available.includes(current) ? current : ""));
          if (candidateDate !== date) {
            setDate(candidateDate);
            setDateNotice(`На выбранный день свободных слотов нет. Календарь перенесен на ближайшую доступную дату: ${formatDate(candidateDate)}.`);
          }
          setLoadingSlots(false);
          return;
        }
      }

      setSlots([]);
      setTimeSlot("");
      setDateNotice("В ближайшие дни свободных слотов нет. Попробуйте выбрать другого мастера.");
      setLoadingSlots(false);
    };
    fetchSlots();
    return () => {
      ignore = true;
    };
  }, [date, masterId]);

  const selectedService = useMemo(() => services.find((service) => service.id === serviceId), [serviceId, services]);
  const selectedMaster = useMemo(
    () => masters.find((master) => master.id === masterId) ?? null,
    [masterId, masters]
  );

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(BOOKING_PROGRESS_EVENT, {
        detail: {
          step,
          total: steps.length,
          submitted: Boolean(success)
        }
      })
    );
  }, [step, success]);

  const nextStep = () => {
    setError("");
    if (step === 1 && !serviceId) {
      setError("Выберите услугу.");
      return;
    }
    if (step === 3 && (!date || !timeSlot)) {
      setError("Выберите дату и свободный слот.");
      return;
    }
    if (step === 4) {
      if (!clientName.trim() || !clientPhone.trim() || !clientEmail.trim()) {
        setError("Заполните контактные данные.");
        return;
      }
    }
    if (step === 4 && !isValidBookingPhone(clientPhone)) {
      setError("Телефон должен начинаться с +7 и содержать 10 цифр после кода страны.");
      return;
    }
    setStep((current) => Math.min(current + 1, 5));
  };

  const prevStep = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!session) {
      setError("Сначала войдите или зарегистрируйтесь, чтобы создать запись.");
      return;
    }
    if (!isValidBookingPhone(clientPhone)) {
      setError("Телефон должен начинаться с +7 и содержать 10 цифр после кода страны.");
      return;
    }
    try {
      setSubmitting(true);
      const appointment = await createAppointment({
        clientName: clientName.trim(),
        clientPhone: normalizeBookingPhone(clientPhone),
        clientEmail: session.email,
        serviceId,
        masterId: masterId === "any" ? null : masterId,
        date,
        timeSlot
      });
      setSuccess(appointment);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось создать заявку.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="hint">Загрузка формы записи...</p>;
  }

  if (!session || session.role !== "client") {
    return (
      <div className="panel booking-success" data-reveal="up">
        <h2>Войдите для записи</h2>
        <p>Запись сохраняется в базе и отображается в личном кабинете только для зарегистрированных клиентов.</p>
        <Link className="cta-button small" href="/account" style={{ marginTop: "1rem" }}>
          Войти или зарегистрироваться
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="panel booking-success" data-reveal="up">
        <h2>Заявка принята!</h2>
        <p>Статус можно отслеживать в личном кабинете.</p>
        <div className="notice success" style={{ marginTop: "1rem" }}>
          Номер заявки: {success.id}. Дата: {formatDate(success.date)}, время: {success.timeSlot}.
        </div>
        <p className="hint" style={{ marginTop: "0.8rem" }}>
          Уведомления клиенту и мастеру отправляются через серверный backend.
        </p>
      </div>
    );
  }

  return (
    <form className="wizard panel booking-wizard" onSubmit={submit} data-reveal="up">
      <div className="wizard-steps">
        {steps.map((stepLabel, index) => {
          const current = index + 1;
          const className = current < step ? "wizard-step done" : current === step ? "wizard-step active" : "wizard-step";
          return (
            <div key={stepLabel} className={className}>
              {current}. {stepLabel}
            </div>
          );
        })}
      </div>

      <div className="wizard-stage" key={`wizard-step-${step}`}>
        {step === 1 ? (
          <div className="option-list">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                className={`option-card ${service.id === serviceId ? "active" : ""}`}
                onClick={() => setServiceId(service.id)}
              >
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <p className="price">от {formatCurrency(service.price)}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="option-list">
            <button
              type="button"
              className={`option-card ${masterId === "any" ? "active" : ""}`}
              onClick={() => setMasterId("any")}
            >
              <h3>Любой свободный мастер</h3>
              <p>Система назначит специалиста с минимальной загрузкой на выбранный слот.</p>
            </button>
            {masters.map((master) => (
              <button
                key={master.id}
                type="button"
                className={`option-card ${master.id === masterId ? "active" : ""}`}
                onClick={() => setMasterId(master.id)}
              >
                <h3>{master.name}</h3>
                <p>{master.bio}</p>
                <p className="hint">
                  Опыт: {master.experience} лет | Рейтинг: {master.rating.toFixed(1)}
                </p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="booking-date">Дата</label>
              <input
                id="booking-date"
                type="date"
                min={getTodayDate()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div>
              <p className="hint" style={{ marginBottom: "0.4rem" }}>
                Свободные слоты ({masterId === "any" ? "любой мастер" : selectedMaster?.name})
              </p>
              {dateNotice ? (
                <div className="notice success" style={{ marginBottom: "0.8rem" }}>
                  {dateNotice}
                </div>
              ) : null}
              {loadingSlots ? (
                <p className="hint">Подбираем свободные слоты...</p>
              ) : (
                <div className="slots-grid">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-button ${slot === timeSlot ? "active" : ""}`}
                      onClick={() => setTimeSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
              {!loadingSlots && slots.length === 0 ? (
                <div className="notice error" style={{ marginTop: "0.8rem" }}>
                  На эту дату нет свободных слотов. Выберите другую дату.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="client-name">Имя</label>
              <input id="client-name" value={clientName} onChange={(event) => setClientName(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="client-phone">Телефон</label>
              <input id="client-phone" value={clientPhone} placeholder="+79991234567" onChange={(event) => setClientPhone(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="client-email">Email</label>
              <input id="client-email" type="email" value={clientEmail} readOnly />
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="panel booking-summary-panel">
            <h3>Проверьте данные перед отправкой</h3>
            <div className="form-grid" style={{ marginTop: "0.7rem" }}>
              <p>
                <strong>Услуга:</strong> {selectedService?.name}
              </p>
              <p>
                <strong>Мастер:</strong> {masterId === "any" ? "Любой свободный" : selectedMaster?.name}
              </p>
              <p>
                <strong>Дата и время:</strong> {formatDate(date)}, {timeSlot}
              </p>
              <p>
                <strong>Клиент:</strong> {clientName}, {clientPhone}, {clientEmail}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="notice error">{error}</p> : null}

      <div className="wizard-nav">
        <button type="button" className="outline-button dark" onClick={prevStep} disabled={step === 1 || submitting}>
          Назад
        </button>
        {step < 5 ? (
          <button type="button" className="cta-button" onClick={nextStep}>
            Далее
          </button>
        ) : (
          <button type="submit" className="cta-button" disabled={submitting}>
            {submitting ? "Отправка..." : "Подтвердить и отправить"}
          </button>
        )}
      </div>
    </form>
  );
}
