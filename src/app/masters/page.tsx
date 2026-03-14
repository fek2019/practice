import Link from "next/link";
import { MastersGrid } from "@/components/masters/masters-grid";

export default function MastersPage() {
  return (
    <div className="masters-page">
      <section className="masters-hero">
        <div className="container masters-hero-grid">
          <div className="masters-hero-copy" data-reveal="left">
            <span className="tag">Команда</span>
            <h1>Опытные мастера Watch Lab</h1>
            <p>
              Специалисты по механическим, кварцевым и smart-часам. Запишитесь к конкретному мастеру или на ближайшее
              свободное окно.
            </p>
            <div className="actions-row">
              <Link href="/booking" className="cta-button">
                Записаться онлайн
              </Link>
              <Link href="/services" className="outline-button">
                Каталог услуг
              </Link>
            </div>
          </div>

          <article className="panel masters-insight" data-reveal="right">
            <h3>Подбор мастера</h3>
            <p>Система учитывает специализацию, опыт и загрузку, чтобы предложить оптимальный вариант ремонта.</p>
            <ul>
              <li>Механика и сложная реставрация</li>
              <li>Кварц и экспресс-диагностика</li>
              <li>Smart-часы и модульный ремонт</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section masters-roster-section">
        <div className="container">
          <MastersGrid />
        </div>
      </section>
    </div>
  );
}
