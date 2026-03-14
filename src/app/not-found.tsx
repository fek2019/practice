import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="section">
      <div className="container">
        <article className="panel">
          <h1>Страница не найдена</h1>
          <p style={{ marginBottom: "1rem" }}>
            Возможно, ссылка устарела. Перейдите на главную или откройте каталог услуг.
          </p>
          <div className="actions-row">
            <Link href="/" className="cta-button">
              На главную
            </Link>
            <Link href="/services" className="outline-button dark">
              Каталог услуг
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

