import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatCurrency,
  getCategoryLabel,
  getRepairTypeLabel
} from "@/lib/format";
import { getMasterById, listServices } from "@/lib/stubs/api";
import { Master } from "@/types";

interface MasterDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const specializationLabel = (value: Master["specialization"]) =>
  value === "universal" ? "Универсальный специалист" : getCategoryLabel(value);

export default async function MasterDetailPage({ params }: MasterDetailPageProps) {
  const { id } = await params;
  const master = await getMasterById(id);

  if (!master) {
    notFound();
  }

  const services = await listServices();
  const relatedServices =
    master.specialization === "universal"
      ? services.slice(0, 4)
      : services
          .filter((service) => service.category === master.specialization)
          .slice(0, 4);

  return (
    <div className="master-detail-page">
      <section className="section">
        <div className="container">
          <div className="split master-detail-layout">
            <article className="card master-profile-card" data-reveal="left">
              <div className="card-spark" aria-hidden="true" />
              <h1>{master.name}</h1>
              <div className="badge-row">
                <span className="small-badge">
                  {specializationLabel(master.specialization)}
                </span>
                <span className="small-badge">{master.experience} лет опыта</span>
                <span className="small-badge rating">★ {master.rating.toFixed(1)}</span>
              </div>
              <p className="master-profile-bio">{master.bio}</p>
              <div className="actions-row master-profile-actions">
                <Link href={`/booking?masterId=${master.id}`} className="cta-button">
                  Записаться к мастеру
                </Link>
                <Link href="/masters" className="outline-button dark">
                  Назад к списку
                </Link>
              </div>
            </article>

            <article className="panel master-about-panel" data-reveal="right">
              <h2>О мастере</h2>
              <p>
                Специалист принимает в филиалах сети и ведет сложные заявки.
                Доступные слоты обновляются в реальном времени в форме
                онлайн-записи.
              </p>
              <div className="notice success master-about-note">
                Приоритет по этому мастеру: точные механизмы, восстановление
                корпуса и настройка хода.
              </div>
            </article>
          </div>

          <section className="master-services-block" data-reveal="up">
            <header className="master-services-head">
              <h2>Услуги мастера</h2>
              <p>
                Подборка по специализации с прямой записью на удобный слот.
              </p>
            </header>

            <div className="cards-grid master-services-grid">
              {relatedServices.map((service, index) => (
                <article
                  key={service.id}
                  className="card service-card masters-related-service"
                  data-reveal="up"
                  style={{ ["--delay" as string]: `${index * 80}ms` }}
                >
                  <div className="card-spark" aria-hidden="true" />
                  <div className="badge-row">
                    <span className="small-badge">
                      {getRepairTypeLabel(service.repairType)}
                    </span>
                  </div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <div className="actions-row">
                    <span className="price">от {formatCurrency(service.price)}</span>
                    <Link
                      href={`/booking?masterId=${master.id}&serviceId=${service.id}`}
                      className="cta-button small"
                    >
                      Записаться
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
