import { ClientDashboard } from "@/components/cabinets/client-dashboard";
import { SectionTitle } from "@/components/ui/section-title";

export default function ClientCabinetPage() {
  return (
    <div className="client-page">
      <section className="section client-page-section">
        <div className="container">
          <SectionTitle
            overline="Кабинет клиента"
            title="История ремонтов и текущие статусы"
            subtitle="Следите за этапами: принят, в процессе, готов к выдаче и завершен."
          />
          <ClientDashboard />
        </div>
      </section>
    </div>
  );
}
