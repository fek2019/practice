import Link from "next/link";

export default function ContactsPage() {
  return (
    <div className="contacts-page">
      <section className="contacts-hero">
        <div className="container contacts-hero-grid">
          <div className="contacts-hero-copy" data-reveal="left">
            <span className="tag">Контакты</span>
            <h1>Раздел контактов обновляется</h1>
            <p>
              Мы готовим новую версию страницы. Контактные данные добавим
              позднее, когда финализируем структуру.
            </p>
            <div className="actions-row">
              <Link href="/booking" className="outline-button">
                Записаться онлайн
              </Link>
            </div>
          </div>

          <article className="panel page-spotlight-panel" data-reveal="right">
            <h3>Контент в подготовке</h3>
            <div className="contacts-empty-slot" aria-hidden="true" />
          </article>
        </div>
      </section>

      <section className="section contacts-main-section">
        <div className="container">
          <div className="split contacts-layout">
            <article className="panel contacts-main-card" data-reveal="left">
              <h3>Главная мастерская</h3>
              <div className="contacts-empty-slot contacts-empty-slot-tall" aria-hidden="true" />
            </article>

            <article className="card contacts-map-card" data-reveal="right">
              <h3>Карта (заглушка)</h3>
              <p className="hint">
                Здесь появится интерактивная карта после подключения финальной
                интеграции.
              </p>
              <div className="contacts-map-stub" />
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
