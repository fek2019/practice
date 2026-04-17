import { ClientDashboard } from "@/components/cabinets/client-dashboard";
import { SectionTitle } from "@/components/ui/section-title";

const clientHighlights = [
  "История обращений",
  "Статусы в реальном времени",
  "Напоминания о готовности"
];

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
          <div className="hero-chip-row cabinet-chip-row" data-reveal="up">
            {clientHighlights.map((item, index) => (
              <span
                key={item}
                className="small-badge inner-chip"
                style={{ ["--delay" as string]: `${index * 80}ms` }}
              >
                {item}
              </span>
            ))}
          </div>
          <ClientDashboard />
        </div>
      </section>
    </div>
  );
}
