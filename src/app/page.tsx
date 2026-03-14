import Link from "next/link";
import { QuickRequestForm } from "@/components/home/quick-request-form";
import { SectionTitle } from "@/components/ui/section-title";

const advantages = [
  {
    title: "Диагностика за 20 минут",
    text: "Проверяем механизм, оцениваем объем работ и сразу фиксируем стоимость в заявке."
  },
  {
    title: "Гарантия до 12 месяцев",
    text: "На все выполненные работы и установленные детали действует официальная гарантия."
  },
  {
    title: "Мастера с опытом 7-18 лет",
    text: "В штате только профильные специалисты по механике, кварцу и smart-часам."
  }
];

const tickerItems = [
  "Премиальный сервис механики",
  "Точная диагностика за 20 минут",
  "Гарантия до 12 месяцев",
  "Онлайн-статусы в личном кабинете",
  "Сложные реставрации корпуса",
  "Запись без звонков"
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero hero-premium">
        <div className="container hero-grid">
          <div className="hero-copy" data-reveal="left">
            <span className="tag">Ремонт часов любой сложности</span>
            <h1>
              <span>Watch Lab</span>
              <span>
                Точность хода
                <br />
                Премиальный цифровой сервис
              </span>
            </h1>
            <p>
              Современный сервис для сети мастерских: прозрачный каталог, онлайн-запись, отслеживание статуса ремонта
              и уведомления без звонков.
            </p>
            <div className="actions-row">
              <Link href="/booking" className="cta-button">
                Записаться на ремонт
              </Link>
              <Link href="/services" className="outline-button">
                Наши услуги
              </Link>
            </div>
            <div className="hero-metrics">
              <div className="metric">
                <strong>15+</strong>
                лет на рынке
              </div>
              <div className="metric">
                <strong>4.9/5</strong>
                средний рейтинг
              </div>
              <div className="metric">
                <strong>12 мес.</strong>
                гарантия
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ticker-section">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`}>
              {item}
              <i />
            </span>
          ))}
        </div>
      </section>

      <section className="section home-benefits-section">
        <div className="container home-benefits">
          <div className="benefits-left" data-reveal="left">
            <SectionTitle
              overline="Почему выбирают нас"
              title="Сервис, которому доверяют семейные и коллекционные часы"
              subtitle="Мы строим процесс так, чтобы клиент понимал каждый этап ремонта и не тратил время на уточняющие звонки."
            />
            <div className="features-grid benefits-cards">
              {advantages.map((advantage, index) => (
                <article
                  key={advantage.title}
                  className="card feature-card premium-card"
                  data-reveal="up"
                  style={{ ["--delay" as string]: `${index * 90}ms` }}
                >
                  <h3>{advantage.title}</h3>
                  <p>{advantage.text}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="benefits-right" data-reveal="right">
            <QuickRequestForm />
            <article className="panel atelier-note" data-reveal="up">
              <h3>Лабораторный подход</h3>
              <p>
                Каждая заявка проходит 4 этапа контроля: первичная диагностика, согласование работ, ремонт, финальный
                тест точности и герметичности.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section ethos-section">
        <div className="container ethos-grid">
          <article className="panel philosophy-card" data-reveal="left">
            <span className="philosophy-kicker">Философия</span>
            <h3>Надежность, точность и прозрачность</h3>
            <p className="philosophy-lead">
              Интерфейс и процесс ремонта разработаны так, чтобы клиенту было комфортно: понятные статусы, честная
              цена, четкие сроки.
            </p>
            <ul className="ethos-list">
              <li>Фиксируем стоимость после диагностики и согласования.</li>
              <li>Показываем статус ремонта в личном кабинете в реальном времени.</li>
              <li>Снижаем нагрузку на звонки через онлайн-запись и уведомления.</li>
            </ul>
          </article>

          <article className="panel philosophy-quote" data-reveal="right">
            <span className="quote-label">Принцип мастерской</span>
            <blockquote>
              «Часы - это не аксессуар, а память о времени. Мы ремонтируем механизм так, чтобы сохранить его характер».
            </blockquote>
            <small>Команда Watch Lab</small>
          </article>
        </div>
      </section>

      <section className="section section-contrast">
        <div className="container">
          <SectionTitle
            overline="Как это работает"
            title="Онлайн-запись в 5 шагов"
            subtitle="Выбор услуги, мастера и времени, контактные данные, подтверждение. Статус ремонта доступен в личном кабинете."
          />
          <div className="cards-grid process-grid">
            <article className="panel process-card" data-reveal="up" style={{ ["--delay" as string]: "40ms" }}>
              <span className="small-badge">Шаг 1</span>
              <h3>Выберите услугу</h3>
              <p>От замены стекла до полной реставрации механизма.</p>
            </article>
            <article className="panel process-card" data-reveal="up" style={{ ["--delay" as string]: "120ms" }}>
              <span className="small-badge">Шаг 2</span>
              <h3>Выберите мастера</h3>
              <p>Можно записаться к конкретному специалисту или на любого свободного мастера.</p>
            </article>
            <article className="panel process-card" data-reveal="up" style={{ ["--delay" as string]: "200ms" }}>
              <span className="small-badge">Шаг 3</span>
              <h3>Выберите дату и слот</h3>
              <p>Система покажет только свободные окна в рабочее время мастерской.</p>
            </article>
            <article className="panel process-card" data-reveal="up" style={{ ["--delay" as string]: "280ms" }}>
              <span className="small-badge">Шаг 4</span>
              <h3>Подтвердите контакты</h3>
              <p>Телефон и email для уведомлений о принятии и готовности ремонта.</p>
            </article>
            <article className="panel process-card" data-reveal="up" style={{ ["--delay" as string]: "360ms" }}>
              <span className="small-badge">Шаг 5</span>
              <h3>Отслеживайте статус</h3>
              <p>В кабинете видны этапы: принят, в работе, готов к выдаче, выдан.</p>
            </article>
            <article className="panel process-card process-card-accent" data-reveal="up" style={{ ["--delay" as string]: "440ms" }}>
              <h3>Запуск за 2 минуты</h3>
              <p>Откройте онлайн-форму и создайте заявку без звонка в мастерскую.</p>
              <Link href="/booking" className="cta-button small">
                Открыть запись онлайн
              </Link>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
