import Link from "next/link";
import { ServicesCatalog } from "@/components/services/services-catalog";

const serviceHighlights = [
  "Диагностика за 20 минут",
  "Фиксируем стоимость после согласования",
  "Статусы ремонта без звонков"
];

export default function ServicesPage() {
  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="container services-hero-grid">
          <div className="services-hero-copy" data-reveal="left">
            <span className="tag">Каталог</span>
            <h1>Услуги по ремонту часов</h1>
            <p>
              Фильтруйте по типу часов, виду ремонта и стоимости. Актуальные
              цены, живые слоты и запись в мастерскую в один клик.
            </p>
            <div className="hero-chip-row" data-reveal="up">
              {serviceHighlights.map((item, index) => (
                <span
                  key={item}
                  className="small-badge inner-chip"
                  style={{ ["--delay" as string]: `${index * 80}ms` }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <article className="panel page-spotlight-panel" data-reveal="right">
            <h3>Поможем выбрать услугу</h3>
            <p>
              Если не уверены в типе ремонта, создайте заявку в 2 клика.
              Мастер уточнит задачу и предложит лучший сценарий.
            </p>
            <Link href="/booking" className="cta-button small">
              Открыть онлайн-запись
            </Link>
          </article>
        </div>

        <div className="container services-catalog-wrap" data-reveal="up">
          <ServicesCatalog />
        </div>
      </section>
    </div>
  );
}
