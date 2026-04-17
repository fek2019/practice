import { MasterDashboard } from "@/components/cabinets/master-dashboard";
import { SectionTitle } from "@/components/ui/section-title";

const masterHighlights = [
  "Календарь загрузки",
  "Изменение статусов заказов",
  "История завершенных работ"
];

export default function MasterCabinetPage() {
  return (
    <div className="master-cabinet-page">
      <section className="section master-cabinet-section">
        <div className="container">
          <SectionTitle
            overline="Кабинет мастера"
            title="Календарь записей и рабочие заказы"
            subtitle="Следите за загрузкой на день, неделю или месяц и обновляйте статусы заказов."
          />
          <div className="hero-chip-row cabinet-chip-row" data-reveal="up">
            {masterHighlights.map((item, index) => (
              <span
                key={item}
                className="small-badge inner-chip"
                style={{ ["--delay" as string]: `${index * 80}ms` }}
              >
                {item}
              </span>
            ))}
          </div>
          <MasterDashboard />
        </div>
      </section>
    </div>
  );
}
