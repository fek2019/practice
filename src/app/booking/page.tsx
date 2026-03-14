import Link from "next/link";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/booking-wizard";

export default function BookingPage() {
  return (
    <div className="booking-page">
      <section className="booking-hero">
        <div className="container booking-hero-grid">
          <div className="booking-hero-copy" data-reveal="left">
            <span className="tag">Запись онлайн</span>
            <h1>Оформите заявку на ремонт в 5 шагов</h1>
            <p>Выберите услугу, мастера, дату и время. После отправки заявка сразу попадет в рабочий контур мастерской.</p>
            <div className="actions-row">
              <Link href="/services" className="outline-button">
                Каталог услуг
              </Link>
            </div>
          </div>

          <article className="panel booking-brief" data-reveal="right">
            <h3>Маршрут заявки</h3>
            <ul>
              <li>Выбор услуги и типа ремонта</li>
              <li>Назначение мастера или авто-подбор</li>
              <li>Подтверждение времени и контактов</li>
              <li>Создание заявки и уведомления клиенту/мастеру</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section booking-form-section">
        <div className="container">
          <Suspense fallback={<p className="hint">Загрузка формы записи...</p>}>
            <BookingWizard />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
