import Link from "next/link";
import { Suspense } from "react";
import { BookingProgressAside } from "@/components/booking/booking-progress-aside";
import { BookingWizard } from "@/components/booking/booking-wizard";

const bookingSignals = [
  { value: "2 мин", label: "среднее время оформления" },
  { value: "24/7", label: "онлайн-запись без звонков" },
  { value: "5 шагов", label: "понятный маршрут клиента" }
];

const bookingScenario = [
  {
    step: "01",
    title: "Опишите задачу",
    text: "Выберите услугу или отметьте проблему, если нужен быстрый подбор."
  },
  {
    step: "02",
    title: "Назначьте мастера",
    text: "Можно выбрать конкретного специалиста или доверить подбор системе."
  },
  {
    step: "03",
    title: "Зафиксируйте слот",
    text: "Система покажет только свободные окна в рабочем графике мастерской."
  },
  {
    step: "04",
    title: "Подтвердите контакты",
    text: "После отправки заявка сразу появится в рабочем контуре мастера."
  }
];

const bookingAdvantages = [
  "Понятный пошаговый интерфейс без перегруза",
  "Проверка данных перед финальным подтверждением",
  "Stub-интеграции уведомлений уже подключены",
  "Единая логика для клиента, мастера и администратора"
];

export default function BookingPage() {
  return (
    <div className="booking-page">
      <section className="booking-hero booking-hero-main">
        <div className="container booking-showcase-grid">
          <div className="booking-showcase-copy" data-reveal="left">
            <span className="tag">Записаться онлайн</span>
            <h1>Заявка на ремонт, которая цепляет с первого экрана</h1>
            <p>
              Мы собрали запись так, чтобы пользователь сразу понимал маршрут:
              что делать, сколько времени это займет и когда мастер примет
              заказ.
            </p>

            <div className="booking-signal-grid">
              {bookingSignals.map((item, index) => (
                <article
                  key={item.label}
                  className="booking-signal-card"
                  style={{ ["--delay" as string]: `${index * 80}ms` }}
                >
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>

            <div className="actions-row">
              <a href="#booking-form" className="cta-button">
                Открыть форму записи
              </a>
              <Link href="/services" className="outline-button">
                Каталог услуг
              </Link>
            </div>
          </div>

          <article className="panel booking-scenario-panel" data-reveal="right">
            <span className="booking-scenario-kicker">Сценарий клиента</span>
            <h3>Путь до подтверждения заявки за один экран</h3>
            <div className="booking-scenario-list">
              {bookingScenario.map((item, index) => (
                <article
                  key={item.step}
                  className="booking-scenario-item"
                  style={{ ["--delay" as string]: `${index * 70}ms` }}
                >
                  <span>{item.step}</span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section booking-advantages-section">
        <div className="container booking-advantages-grid" data-reveal="up">
          {bookingAdvantages.map((item, index) => (
            <article
              key={item}
              className="card booking-advantage-card"
              style={{ ["--delay" as string]: `${index * 70}ms` }}
            >
              <div className="card-spark" aria-hidden="true" />
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section booking-form-section" id="booking-form">
        <div className="container booking-form-wrap">
          <BookingProgressAside />

          <div className="booking-form-content" data-reveal="right">
            <Suspense fallback={<p className="hint">Загрузка формы записи...</p>}>
              <BookingWizard />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
