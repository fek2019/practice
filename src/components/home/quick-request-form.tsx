"use client";

import { FormEvent, useEffect, useState } from "react";
import { createQuickRequest, listServices } from "@/lib/stubs/api";
import { Service } from "@/types";

export function QuickRequestForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listServices().then((result) => {
      setServices(result);
      setServiceName(result[0]?.name ?? "");
    });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!clientName.trim() || !clientPhone.trim() || !serviceName.trim()) {
      setError("Заполните имя, телефон и услугу.");
      return;
    }

    try {
      setLoading(true);
      await createQuickRequest({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceName
      });
      setMessage("Заявка отправлена. Менеджер свяжется с вами в течение 15 минут.");
      setClientName("");
      setClientPhone("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить заявку.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="quick-form" onSubmit={handleSubmit} data-reveal="up">
      <h3>Быстрая запись</h3>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="quick-name">Имя</label>
          <input
            id="quick-name"
            placeholder="Как к вам обращаться"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="quick-phone">Телефон</label>
          <input
            id="quick-phone"
            placeholder="+7 (___) ___-__-__"
            value={clientPhone}
            onChange={(event) => setClientPhone(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="quick-service">Услуга</label>
          <select id="quick-service" value={serviceName} onChange={(event) => setServiceName(event.target.value)}>
            {services.map((service) => (
              <option key={service.id} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button className="cta-button" type="submit" disabled={loading}>
        {loading ? "Отправка..." : "Отправить заявку"}
      </button>
      <p className="hint">Отправка уходит в mock API, затем замените на Firebase Function.</p>
      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}
    </form>
  );
}
