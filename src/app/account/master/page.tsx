import { MasterDashboard } from "@/components/cabinets/master-dashboard";
import { SectionTitle } from "@/components/ui/section-title";

export default function MasterCabinetPage() {
  return (
    <div className="master-cabinet-page">
      <section className="section master-cabinet-section">
        <div className="container">
          <SectionTitle
            overline="Кабинет мастера"
            title="Календарь записей и рабочие заказы"
            subtitle="Смотрите загрузку на день/неделю/месяц и обновляйте статусы заказов."
          />
          <MasterDashboard />
        </div>
      </section>
    </div>
  );
}
