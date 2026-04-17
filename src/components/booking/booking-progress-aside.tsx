"use client";

import { useEffect, useMemo, useState } from "react";

const BOOKING_PROGRESS_EVENT = "booking-wizard:progress";

const progressSteps = ["Услуга", "Мастер", "Дата и время", "Контакты", "Подтверждение"];

type BookingProgressDetail = {
  step?: number;
  total?: number;
  submitted?: boolean;
};

export function BookingProgressAside() {
  const [step, setStep] = useState(1);
  const [total, setTotal] = useState(progressSteps.length);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleProgress = (event: Event) => {
      const customEvent = event as CustomEvent<BookingProgressDetail>;
      const nextTotal = Math.max(1, customEvent.detail?.total ?? progressSteps.length);
      const nextStep = Math.min(Math.max(customEvent.detail?.step ?? 1, 1), nextTotal);

      setTotal(nextTotal);
      setStep(nextStep);
      setSubmitted(Boolean(customEvent.detail?.submitted));
    };

    window.addEventListener(BOOKING_PROGRESS_EVENT, handleProgress);
    return () => window.removeEventListener(BOOKING_PROGRESS_EVENT, handleProgress);
  }, []);

  const progressPercent = useMemo(() => {
    if (submitted) {
      return 100;
    }
    return Math.round((step / total) * 100);
  }, [step, submitted, total]);

  return (
    <aside className="panel booking-form-side booking-form-side-sticky" data-reveal="left">
      <div className="booking-progress-head">
        <h3>Перед отправкой</h3>
        <span className="booking-progress-badge">
          {submitted ? "Готово" : `Шаг ${step}/${total}`}
        </span>
      </div>

      <div
        className="booking-progress-bar"
        role="progressbar"
        aria-label="Прогресс заполнения заявки"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <span style={{ ["--progress" as string]: `${progressPercent}%` }} />
      </div>

      <p className="booking-progress-caption">
        {submitted ? "Заявка отправлена, можно отслеживать статус в кабинете." : "Заполнение обычно занимает около 2 минут."}
      </p>

      <ol className="booking-progress-list">
        {progressSteps.map((label, index) => {
          const order = index + 1;
          const itemClass = submitted || order < step ? "is-done" : order === step ? "is-active" : "";

          return (
            <li key={label} className={itemClass}>
              <span>{String(order).padStart(2, "0")}</span>
              <p>{label}</p>
            </li>
          );
        })}
      </ol>

      <ul className="booking-checklist">
        <li>Проверьте выбранную услугу и окно приема.</li>
        <li>Оставьте актуальные контакты для уведомлений.</li>
        <li>После отправки статус сразу доступен в кабинете.</li>
      </ul>
    </aside>
  );
}
