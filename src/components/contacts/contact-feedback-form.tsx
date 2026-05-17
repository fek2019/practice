"use client";

import { FormEvent, useState } from "react";
import { createQuickRequest } from "@/lib/api-client";

const topics = [
  "Консультация по ремонту",
  "Статус существующей заявки",
  "Сложная реставрация",
  "Корпоративный заказ",
  "Другое"
];

export function ContactFeedbackForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Укажите имя и контактный телефон.");
      return;
    }

    try {
      setLoading(true);
      await createQuickRequest({
        clientName: name.trim(),
        clientPhone: phone.trim(),
        serviceName: `[Обратная связь] ${topic}${message.trim() ? ` — ${message.trim()}` : ""}${email.trim() ? ` | email: ${email.trim()}` : ""}`
      });
      setNotice("Сообщение принято. Менеджер свяжется с вами в течение 15 минут в рабочее время.");
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
      setTopic(topics[0]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить сообщение.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="quick-form contacts-feedback-form" onSubmit={handleSubmit} data-reveal="up">
      <div className="contacts-feedback-head">
        <h3>Напишите нам</h3>
        <p className="hint">
          Если вопрос не из стандартного каталога, опишите ситуацию и мы подберем мастера и время диагностики.
        </p>
      </div>
      <div className="form-grid contacts-feedback-grid">
        <div className="field">
          <label htmlFor="contacts-name">Имя</label>
          <input
            id="contacts-name"
            placeholder="Как к вам обращаться"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label htmlFor="contacts-phone">Телефон</label>
          <input
            id="contacts-phone"
            placeholder="+7 (___) ___-__-__"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="field">
          <label htmlFor="contacts-email">Email</label>
          <input
            id="contacts-email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="contacts-topic">Тема обращения</label>
          <select id="contacts-topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
            {topics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="contacts-message">Сообщение</label>
        <textarea
          id="contacts-message"
          rows={4}
          placeholder="Опишите марку часов, тип задачи или приложите номер заявки"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
      <button className="cta-button" type="submit" disabled={loading}>
        {loading ? "Отправка..." : "Отправить сообщение"}
      </button>
      <p className="hint">
        Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных в рамках регламента мастерской.
      </p>
      {notice ? <p className="notice success">{notice}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}
    </form>
  );
}
