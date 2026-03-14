import { AdminDashboard } from "@/components/cabinets/admin-dashboard";
import { SectionTitle } from "@/components/ui/section-title";

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
          <AdminDashboard />
        </div>
      </section>
    </div>
  );
}
