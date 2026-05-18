import Link from "next/link";

const footerSections = [
  {
    title: "Разделы",
    links: [
      { href: "/", label: "Главная" },
      { href: "/services", label: "Услуги" },
      { href: "/masters", label: "Мастера" },
      { href: "/booking", label: "Запись онлайн" },
      { href: "/contacts", label: "Контакты" }
    ]
  },
  {
    title: "Кабинеты",
    links: [
      { href: "/account", label: "Вход в кабинет" },
      { href: "/account/client", label: "Кабинет клиента" },
      { href: "/account/master", label: "Кабинет мастера" },
      { href: "/admin", label: "Админ-панель" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Watch Lab</h3>
          <p>
            Премиальный сервис ремонта часов: онлайн-запись, прозрачные статусы,
            кабинеты клиента, мастера и администратора.
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h4>{section.title}</h4>
            <ul>
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4>Контакты</h4>
          <ul className="footer-contacts">
            <li>
              <span>Телефон</span>
              <a href="tel:+74952002137">+7 (495) 200-21-37</a>
            </li>
            <li>
              <span>Email</span>
              <a href="mailto:hello@watchlab.ru">hello@watchlab.ru</a>
            </li>
            <li>
              <span>Адрес</span>
              <Link href="/contacts">Москва, ул. Покровка, 12</Link>
            </li>
            <li>
              <span>Часы работы</span>
              <span>Ежедневно 10:00 - 21:00</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
