"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategoryLabel } from "@/lib/format";
import { listMasters } from "@/lib/stubs/api";
import { Master } from "@/types";

const getSpecializationLabel = (value: Master["specialization"]) => {
  if (value === "universal") {
    return "Универсальный специалист";
  }
  return getCategoryLabel(value);
};

const masterSkeleton = [1, 2, 3];

export function MastersGrid() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMasters().then((data) => {
      setMasters(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="cards-grid masters-grid masters-skeleton-grid">
        {masterSkeleton.map((item) => (
          <article
            key={`master-skeleton-${item}`}
            className="card master-card masters-card master-card-skeleton"
            aria-hidden="true"
          >
            <div className="card-spark master-skeleton-spark" />
            <div className="badge-row">
              <span className="master-skeleton-chip" />
              <span className="master-skeleton-chip" />
            </div>
            <div className="master-skeleton-line master-skeleton-line-title" />
            <div className="master-skeleton-line" />
            <div className="master-skeleton-line master-skeleton-line-short" />
            <div className="service-skeleton-footer">
              <span className="service-skeleton-button" />
              <span className="service-skeleton-button" />
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="cards-grid masters-grid">
      {masters.map((master, index) => (
        <article
          key={master.id}
          className="card master-card masters-card"
          data-reveal="up"
          style={{ ["--delay" as string]: `${index * 70}ms` }}
        >
          <div className="card-spark" aria-hidden="true" />
          <h3>{master.name}</h3>
          <div className="badge-row">
            <span className="small-badge">
              {getSpecializationLabel(master.specialization)}
            </span>
            <span className="small-badge">{master.experience} лет опыта</span>
            <span className="small-badge rating">★ {master.rating.toFixed(1)}</span>
          </div>
          <p>{master.bio}</p>
          <div className="actions-row">
            <Link href={`/masters/${master.id}`} className="outline-button dark">
              Подробнее
            </Link>
            <Link href={`/booking?masterId=${master.id}`} className="cta-button small">
              Записаться
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
