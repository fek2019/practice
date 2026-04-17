import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Watch Lab</h3>
          <p>
            Премиальный сервис ремонта часов. Работаем над новой структурой
            контента и постепенно обновляем все публичные разделы.
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
              <Link href="/admin">Админка</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Контакты</h4>
          <div className="footer-empty-slot" aria-hidden="true" />
        </div>
      </div>
    </footer>
  );
}
