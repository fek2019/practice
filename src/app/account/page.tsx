import Link from "next/link";
import { AccountHub } from "@/components/account/account-hub";

const featureGroups = [
  {
    role: "Клиент",
    title: "История и статусы ремонта",
    points: [
      "Все заявки в одном списке: текущие и завершенные",
      "Этапы ремонта: принят → диагностика → ремонт → готов к выдаче",
      "Уведомления в Telegram и по email о смене статуса",
      "Напоминания о готовности и дате выдачи"
    ],
    href: "/account/client",
    cta: "Открыть кабинет клиента"
  },
  {
    role: "Мастер",
    title: "Календарь записей и текущие заказы",
    points: [
      "Календарь на день, неделю и месяц",
      "Смена статуса в один клик: принят → в работе → готов",
      "История выполненных работ с возможностью открыть карточку",
      "Видны контакты клиента и тип часов"
    ],
    href: "/account/master",
    cta: "Открыть кабинет мастера"
  },
  {
    role: "Администратор",
    title: "Управление мастерской и статистика",
    points: [
      "CRUD по услугам, мастерам и ценам",
      "Загрузка мастеров и количество записей за период",
      "Популярные услуги и выручка в графике",
      "Просмотр и фильтрация заявок по статусу и дате"
    ],
    href: "/admin",
    cta: "Открыть админ-панель"
  }
];

const authFlow = [
  {
    badge: "Шаг 1",
    title: "Выберите роль",
    text: "Демо-режим переключает контекст между клиентом, мастером и администратором."
  },
  {
    badge: "Шаг 2",
    title: "Войдите по email или телефону",
    text: "Email + пароль для регулярных пользователей, телефон + SMS-код для клиентов."
  },
  {
    badge: "Шаг 3",
    title: "Перейдите в свой кабинет",
    text: "После входа доступны рабочие пространства и переходы в подкабинеты."
  }
];

const accountFaq = [
  {
    question: "Можно ли войти без регистрации?",
    answer:
      "Да. Демо-роли переключаются прямо на странице — используйте их, чтобы изучить интерфейс клиента, мастера и администратора."
  },
  {
    question: "Что делать, если код не пришел?",
    answer:
      "В демо-режиме код подставляется автоматически. В рабочем режиме мастерская отправит код повторно — кнопка «Получить код» становится активной через 60 секунд."
  },
  {
    question: "Как переключиться между ролями?",
    answer:
      "Выйдите из текущего аккаунта и выберите другую демо-роль. Сессия и переходы между кабинетами сохраняются локально в браузере."
  }
];

export default function AccountPage() {
  return (
    <div className="account-page">
      <section className="section account-page-section">
        <div className="container">
          <AccountHub />
        </div>
      </section>

      <section className="section account-features-section">
        <div className="container">
          <div className="section-title" data-reveal="up">
            <span className="overline">Что доступно в кабинете</span>
            <h2>Три рабочих пространства под каждую роль</h2>
            <p>
              Интерфейс перестраивается под клиента, мастера и администратора —
              без перезагрузок и переключений между приложениями.
            </p>
          </div>
          <div className="cards-grid account-features-grid">
            {featureGroups.map((group, index) => (
              <article
                key={group.role}
                className="panel account-feature-card"
                data-reveal="up"
                style={{ ["--delay" as string]: `${index * 90}ms` }}
              >
                <span className="small-badge">{group.role}</span>
                <h3>{group.title}</h3>
                <ul className="account-feature-points">
                  {group.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <Link href={group.href} className="cta-button small">
                  {group.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section account-flow-section">
        <div className="container">
          <div className="section-title" data-reveal="up">
            <span className="overline">Как войти</span>
            <h2>Три шага до личного кабинета</h2>
            <p>
              Подойдет любой способ входа. После авторизации система запомнит
              роль и сразу откроет нужный кабинет.
            </p>
          </div>
          <div className="cards-grid account-flow-grid">
            {authFlow.map((item, index) => (
              <article
                key={item.title}
                className="panel account-flow-card"
                data-reveal="up"
                style={{ ["--delay" as string]: `${index * 90}ms` }}
              >
                <span className="small-badge">{item.badge}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section account-faq-section">
        <div className="container">
          <div className="section-title" data-reveal="up">
            <span className="overline">Частые вопросы</span>
            <h2>Что нужно знать о входе</h2>
          </div>
          <div className="cards-grid account-faq-grid">
            {accountFaq.map((item, index) => (
              <article
                key={item.question}
                className="panel account-faq-card"
                data-reveal="up"
                style={{ ["--delay" as string]: `${index * 80}ms` }}
              >
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
          <div className="account-faq-foot" data-reveal="up">
            <p className="hint">
              Не получилось войти или есть вопрос по аккаунту?
            </p>
            <Link href="/contacts" className="outline-button dark">
              Написать в поддержку
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
