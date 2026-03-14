"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { createAppointment, getAvailableSlots, listMasters, listServices } from "@/lib/stubs/api";
import { Appointment, Master, Service } from "@/types";

const steps = ["Услуга", "Мастер", "Дата и время", "Контакты", "Подтверждение"];

const getTodayDate = () => new Date().toISOString().slice(0, 10);

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
  const [success, setSuccess] = useState<Appointment | null>(null);

  const [serviceId, setServiceId] = useState("");
  const [masterId, setMasterId] = useState("any");
  const [date, setDate] = useState(getTodayDate());
  const [timeSlot, setTimeSlot] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

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
    const fetchSlots = async () => {
      setLoadingSlots(true);
      const available = await getAvailableSlots(date, masterId === "any" ? null : masterId);
      setSlots(available);
      if (timeSlot && !available.includes(timeSlot)) {
        setTimeSlot("");
      }
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [date, masterId, timeSlot]);

  const selectedService = useMemo(() => services.find((service) => service.id === serviceId), [serviceId, services]);
  const selectedMaster = useMemo(
    () => masters.find((master) => master.id === masterId) ?? null,
    [masterId, masters]
  );

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
    setStep((current) => Math.min(current + 1, 5));
  };

  const prevStep = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      setSubmitting(true);
      const appointment = await createAppointment({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
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

  if (success) {
    return (
      <div className="panel booking-success" data-reveal="up">
        <h2>Заявка принята!</h2>
        <p>Статус можно отслеживать в личном кабинете.</p>
        <div className="notice success" style={{ marginTop: "1rem" }}>
          Номер заявки: {success.id}. Дата: {formatDate(success.date)}, время: {success.timeSlot}.
        </div>
        <p className="hint" style={{ marginTop: "0.8rem" }}>
          Уведомления клиенту и мастеру отправляются через stub-функции в `src/lib/stubs/api.ts`.
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
              <input id="client-phone" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="client-email">Email</label>
              <input id="client-email" type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} />
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
