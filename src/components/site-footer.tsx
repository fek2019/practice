import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Watch Lab</h3>
          <p>
            Премиальный сервис ремонта часов. Прозрачные статусы, фиксированная
            стоимость после диагностики и онлайн-запись без звонков.
          </p>
        </div>
        <div>
          <h4>Разделы</h4>
          <ul>
            <li>
              <Link href="/services">Каталог услуг</Link>
            </li>
            <li>
              <Link href="/masters">Наши мастера</Link>
            </li>
            <li>
              <Link href="/booking">Онлайн-запись</Link>
            </li>
            <li>
              <Link href="/account">Личный кабинет</Link>
            </li>
            <li>
              <Link href="/contacts">Контакты</Link>
            </li>
          </ul>
        </div>
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
              <span>Москва, ул. Покровка, 12, ст. 4</span>
            </li>
            <li>
              <span>Часы работы</span>
              <span>Ежедневно 10:00 — 21:00</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
