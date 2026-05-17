import Link from "next/link";
import { ContactFeedbackForm } from "@/components/contacts/contact-feedback-form";

const heroHighlights = [
  "Ответ в течение 15 минут",
  "Премиальный сервис без звонков",
  "Открыты ежедневно"
];

const contactChannels = [
  {
    title: "Телефон",
    value: "+7 (495) 200-21-37",
    note: "Прием звонков с 10:00 до 21:00, ежедневно",
    href: "tel:+74952002137"
  },
  {
    title: "Email",
    value: "hello@watchlab.ru",
    note: "Ответ в течение 2 часов в рабочее время",
    href: "mailto:hello@watchlab.ru"
  },
  {
    title: "Telegram",
    value: "@watchlab_service",
    note: "Уведомления о статусе и оперативные ответы мастера",
    href: "https://t.me/watchlab_service"
  },
  {
    title: "WhatsApp",
    value: "+7 (903) 200-21-37",
    note: "Фото механизма и предварительная оценка",
    href: "https://wa.me/79032002137"
  }
];

const workshopSchedule = [
  { day: "Понедельник — Пятница", hours: "10:00 — 21:00" },
  { day: "Суббота", hours: "11:00 — 20:00" },
  { day: "Воскресенье", hours: "12:00 — 19:00" }
];

const branches = [
  {
    city: "Москва",
    title: "Главная мастерская",
    address: "ул. Покровка, 12, ст. 4",
    metro: "м. Китай-город, 5 минут пешком",
    phone: "+7 (495) 200-21-37",
    hours: "Ежедневно 10:00 — 21:00",
    note: "Приемка сложных калибров, реставрация корпусов и витринная зона."
  },
  {
    city: "Санкт-Петербург",
    title: "Сервис на Невском",
    address: "Невский пр., 78, БЦ «Граф Орлов»",
    metro: "м. Гостиный двор, 7 минут пешком",
    phone: "+7 (812) 200-21-37",
    hours: "Ежедневно 11:00 — 20:00",
    note: "Кварц, smart-часы и экспресс-обслуживание в течение дня."
  },
  {
    city: "Казань",
    title: "Региональный центр",
    address: "ул. Баумана, 44",
    metro: "м. Площадь Тукая, 3 минуты пешком",
    phone: "+7 (843) 200-21-37",
    hours: "Пн — Сб 10:00 — 20:00",
    note: "Приемка, выдача и пересылка часов в главную мастерскую."
  }
];

const faqItems = [
  {
    question: "Как записаться без звонка?",
    answer:
      "Через раздел «Запись онлайн». Выбираете услугу, мастера и удобный слот — заявка сразу попадает к мастеру, статус виден в личном кабинете."
  },
  {
    question: "Когда можно подъехать в мастерскую?",
    answer:
      "Главная мастерская в Москве работает ежедневно с 10:00 до 21:00. В Петербурге и Казани график немного короче — см. блок «Филиалы»."
  },
  {
    question: "Как узнать статус ремонта?",
    answer:
      "В личном кабинете клиента и в Telegram-уведомлениях. Каждый этап (принят, диагностика, ремонт, готов к выдаче) фиксируется автоматически."
  },
  {
    question: "Принимаете ли вы часы из других городов?",
    answer:
      "Да, мы отправляем курьера или принимаем посылку с подтверждением. Подробности можно обсудить через форму на этой странице или в Telegram."
  },
  {
    question: "Даете ли гарантию на работы?",
    answer:
      "На все выполненные работы и установленные детали действует официальная гарантия мастерской до 12 месяцев."
  }
];

export default function ContactsPage() {
  return (
    <div className="contacts-page">
      <section className="contacts-hero">
        <div className="container contacts-hero-grid">
          <div className="contacts-hero-copy" data-reveal="left">
            <span className="tag">Контакты</span>
            <h1>Свяжитесь с Watch Lab удобным способом</h1>
            <p>
              Позвоните, напишите в мессенджер или оформите заявку онлайн —
              мастер на приемке отвечает в течение 15 минут в рабочее время.
            </p>
            <div className="hero-chip-row" data-reveal="up">
              {heroHighlights.map((item, index) => (
                <span
                  key={item}
                  className="small-badge inner-chip"
                  style={{ ["--delay" as string]: `${index * 80}ms` }}
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="actions-row">
              <Link href="/booking" className="cta-button">
                Записаться онлайн
              </Link>
              <a href="tel:+74952002137" className="outline-button">
                Позвонить мастерской
              </a>
            </div>
          </div>

          <article className="panel page-spotlight-panel contacts-spotlight" data-reveal="right">
            <span className="small-badge">Watch Lab · сеть мастерских</span>
            <h3>Три точки приема, единый центр диагностики</h3>
            <p>
              Москва, Санкт-Петербург и Казань. Прием в любом городе, сложные
              работы выполняются на главной мастерской в Москве с курьерской
              доставкой обратно.
            </p>
            <ul className="contacts-spotlight-list">
              <li>Прозрачные статусы ремонта</li>
              <li>Премиальная упаковка и страхование</li>
              <li>Уведомления в Telegram и по email</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section contacts-channels-section">
        <div className="container">
          <div className="section-title" data-reveal="up">
            <span className="overline">Каналы связи</span>
            <h2>Выберите удобный способ обращения</h2>
            <p>
              Мы дублируем уведомления в нескольких каналах — звонок, мессенджер
              или email. Решение остается за вами.
            </p>
          </div>
          <div className="cards-grid contacts-channels-grid">
            {contactChannels.map((channel, index) => (
              <article
                key={channel.title}
                className="card contacts-channel-card"
                data-reveal="up"
                style={{ ["--delay" as string]: `${index * 80}ms` }}
              >
                <span className="small-badge">{channel.title}</span>
                {channel.href ? (
                  <a className="contacts-channel-value" href={channel.href}>
                    {channel.value}
                  </a>
                ) : (
                  <span className="contacts-channel-value">{channel.value}</span>
                )}
                <p>{channel.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section contacts-main-section">
        <div className="container">
          <div className="split contacts-layout">
            <article className="panel contacts-main-card" data-reveal="left">
              <span className="small-badge">Главная мастерская</span>
              <h3>Москва, ул. Покровка, 12</h3>
              <div className="contacts-list">
                <p>
                  <strong>Метро:</strong> Китай-город, 5 минут пешком
                </p>
                <p>
                  <strong>Телефон:</strong>{" "}
                  <a href="tel:+74952002137">+7 (495) 200-21-37</a>
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:hello@watchlab.ru">hello@watchlab.ru</a>
                </p>
              </div>
              <div className="contacts-schedule">
                <h4>Часы работы</h4>
                <ul>
                  {workshopSchedule.map((item) => (
                    <li key={item.day}>
                      <span>{item.day}</span>
                      <strong>{item.hours}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="contacts-note hint">
                Приемка часов производится без записи, ремонт — по слоту в
                личном кабинете. Для дорогих калибров рекомендуем заранее
                согласовать визит с мастером.
              </p>
            </article>

            <article className="card contacts-map-card" data-reveal="right">
              <h3>Как нас найти</h3>
              <p className="hint">
                Декоративная мини-карта главной точки. Для полноценного
                маршрута используйте навигатор по адресу Покровка, 12.
              </p>
              <div className="contacts-map-stub" aria-hidden="true" />
              <div className="contacts-map-meta">
                <div>
                  <span>Координаты</span>
                  <strong>55.7588° N, 37.6498° E</strong>
                </div>
                <div>
                  <span>Парковка</span>
                  <strong>Платная, во дворе БЦ</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section contacts-branches-section">
        <div className="container">
          <div className="section-title" data-reveal="up">
            <span className="overline">Филиалы</span>
            <h2>Где принимаем часы</h2>
            <p>
              Прием и выдача доступны в трех городах. Курьерская логистика
              между точками — за счет мастерской при заказе от 5 000 ₽.
            </p>
          </div>
          <div className="cards-grid contacts-branches-grid">
            {branches.map((branch, index) => (
              <article
                key={branch.city}
                className="panel contacts-branch-card"
                data-reveal="up"
                style={{ ["--delay" as string]: `${index * 90}ms` }}
              >
                <span className="small-badge">{branch.city}</span>
                <h3>{branch.title}</h3>
                <p className="contacts-branch-address">{branch.address}</p>
                <p className="hint">{branch.metro}</p>
                <div className="contacts-branch-meta">
                  <div>
                    <span>Телефон</span>
                    <a href={`tel:${branch.phone.replace(/[^+\d]/g, "")}`}>
                      <strong>{branch.phone}</strong>
                    </a>
                  </div>
                  <div>
                    <span>Часы</span>
                    <strong>{branch.hours}</strong>
                  </div>
                </div>
                <p className="contacts-branch-note">{branch.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section contacts-feedback-section">
        <div className="container contacts-feedback-grid-wrap">
          <article className="panel contacts-feedback-aside" data-reveal="left">
            <span className="small-badge">Обратная связь</span>
            <h2>Не нашли ответ?</h2>
            <p>
              Опишите задачу — мы свяжемся, уточним детали и предложим лучший
              сценарий ремонта. Сложные кейсы передаем главному мастеру.
            </p>
            <ul className="contacts-feedback-points">
              <li>Не для записи — для общих вопросов и сложных случаев</li>
              <li>Ответ в Telegram, по email или звонком — на ваш выбор</li>
              <li>Конфиденциальность данных и фото гарантирована</li>
            </ul>
            <Link href="/booking" className="outline-button dark">
              Перейти к онлайн-записи
            </Link>
          </article>
          <ContactFeedbackForm />
        </div>
      </section>

      <section className="section contacts-faq-section">
        <div className="container">
          <div className="section-title" data-reveal="up">
            <span className="overline">Частые вопросы</span>
            <h2>Коротко о работе мастерской</h2>
            <p>
              Здесь собраны самые частые вопросы, на которые отвечают мастера в
              мессенджерах. Если не нашли свой — напишите выше.
            </p>
          </div>
          <div className="cards-grid contacts-faq-grid">
            {faqItems.map((item, index) => (
              <article
                key={item.question}
                className="panel contacts-faq-card"
                data-reveal="up"
                style={{ ["--delay" as string]: `${index * 80}ms` }}
              >
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
