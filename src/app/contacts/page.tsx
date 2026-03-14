export default function ContactsPage() {
  return (
    <div className="contacts-page">
      <section className="contacts-hero">
        <div className="container">
          <div className="contacts-hero-copy" data-reveal="left">
            <span className="tag">Контакты</span>
            <h1>Как нас найти</h1>
            <p>Три мастерские по Москве, единый номер для консультаций и онлайн-записи.</p>
            <div className="contacts-tags">
              <span className="small-badge">Ежедневно 10:00-19:00</span>
              <span className="small-badge">Срочный прием до 17:30</span>
              <span className="small-badge">Подтверждение в день обращения</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section contacts-main-section">
        <div className="container">
          <div className="split contacts-layout">
            <article className="panel contacts-main-card" data-reveal="left">
              <h3>Главная мастерская</h3>
              <div className="contacts-list">
                <p>Москва, ул. Покровка, 18</p>
                <p>+7 (495) 120-40-40</p>
                <p>hello@watchlab.ru</p>
                <p>Ежедневно 10:00-19:00</p>
              </div>
              <div className="notice success contacts-note">Прием срочных заказов до 17:30.</div>
            </article>

            <article className="card contacts-map-card" data-reveal="right">
              <h3>Карта (заглушка)</h3>
              <p className="hint">
                В финальной версии подключите Yandex/Google Maps через клиентский SDK (фронтенд-подключение).
              </p>
              <div className="contacts-map-stub" />
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
