import { AdminDashboard } from "@/components/cabinets/admin-dashboard";
import { SectionTitle } from "@/components/ui/section-title";

const adminHighlights = [
  "Управление услугами",
  "Работа с мастерами",
  "Статистика и загрузка"
];

export default function AdminPage() {
  return (
    <div className="admin-page">
      <section className="section admin-page-section">
        <div className="container">
          <SectionTitle
            overline="Admin"
            title="Управление мастерской"
            subtitle="CRUD по услугам и мастерам, управление ценами и аналитика записей."
          />
          <div className="hero-chip-row cabinet-chip-row" data-reveal="up">
            {adminHighlights.map((item, index) => (
              <span
                key={item}
                className="small-badge inner-chip"
                style={{ ["--delay" as string]: `${index * 80}ms` }}
              >
                {item}
              </span>
            ))}
          </div>
          <AdminDashboard />
        </div>
      </section>
    </div>
  );
}
