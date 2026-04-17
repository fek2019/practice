import Link from "next/link";
import { MastersGrid } from "@/components/masters/masters-grid";

const masteryHighlights = [
  "Механика и сложные калибры",
  "Quartz и экспресс-обслуживание",
  "Smart-часы и модульный ремонт"
];

export default function MastersPage() {
  return (
    <div className="masters-page">
      <section className="masters-hero">
        <div className="container masters-hero-grid">
          <div className="masters-hero-copy" data-reveal="left">
            <span className="tag">Команда</span>
            <h1>Опытные мастера Watch Lab</h1>
            <p>
              Подберите специалиста под тип часов и задачу ремонта. Учитываем
              специализацию, опыт и текущую загрузку мастеров.
            </p>
            <div className="hero-chip-row" data-reveal="up">
              {masteryHighlights.map((item, index) => (
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
              <Link href="/services" className="outline-button">
                Каталог услуг
              </Link>
            </div>
          </div>

          <article className="panel masters-insight page-spotlight-panel" data-reveal="right">
            <h3>Подбор мастера</h3>
            <p>
              Система учитывает специализацию, график и тип заявки, чтобы
              предложить оптимальный слот и сократить время ожидания.
            </p>
            <ul>
              <li>Живой рейтинг специалистов</li>
              <li>Онлайн-слоты в рабочее время</li>
              <li>Быстрый переход к записи</li>
              <li>Подбор по сложности и срочности ремонта</li>
              <li>Альтернативные окна при высокой загрузке</li>
            </ul>
            <p className="masters-insight-foot">
              Перед записью клиент видит понятный план: кто выполнит работу,
              когда доступен прием и как быстро мастер сможет взять заявку в
              обработку.
            </p>
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
