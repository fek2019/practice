import { ServicesCatalog } from "@/components/services/services-catalog";

export default function ServicesPage() {
  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="container">
          <div className="services-hero-copy" data-reveal="left">
            <span className="tag">Каталог</span>
            <h1>Услуги по ремонту часов</h1>
            <p>Фильтруйте по типу часов, виду ремонта и стоимости. Актуальные цены и запись в один клик.</p>
          </div>

          <ServicesCatalog />
        </div>
      </section>
    </div>
  );
}
