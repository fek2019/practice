import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Watch Lab</h3>
          <p>Ремонт часов любой сложности. Гарантия, прозрачная цена и бережный подход к каждому механизму.</p>
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
              <Link href="/admin">Админка</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Контакты</h4>
          <ul>
            <li>Москва, ул. Покровка, 18</li>
            <li>+7 (495) 120-40-40</li>
            <li>hello@watchlab.ru</li>
            <li>Ежедневно 10:00-19:00</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

