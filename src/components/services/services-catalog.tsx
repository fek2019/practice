"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatCurrency,
  getCategoryLabel,
  getRepairTypeLabel
} from "@/lib/format";
import { listServices } from "@/lib/stubs/api";
import { RepairType, Service, WatchCategory } from "@/types";

const categoryOptions: Array<{ label: string; value: WatchCategory | "all" }> = [
  { label: "Все типы", value: "all" },
  { label: "Механические", value: "mechanical" },
  { label: "Кварцевые", value: "quartz" },
  { label: "Smart", value: "smart" }
];

const repairTypeOptions: Array<{ label: string; value: RepairType | "all" }> = [
  { label: "Все виды", value: "all" },
  { label: "Стекло", value: "glass" },
  { label: "Чистка", value: "cleaning" },
  { label: "Реставрация", value: "restoration" },
  { label: "Батарейка", value: "battery" },
  { label: "Водозащита", value: "waterproofing" }
];

const skeletonCards = [1, 2, 3];

export function ServicesCatalog() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<WatchCategory | "all">("all");
  const [repairType, setRepairType] = useState<RepairType | "all">("all");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("20000");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await listServices({
        category,
        repairType,
        minPrice: Number(minPrice) || 0,
        maxPrice: Number(maxPrice) || 20000
      });
      setServices(result);
      setLoading(false);
    };
    fetchData();
  }, [category, repairType, minPrice, maxPrice]);

  return (
    <>
      <div className="filters-grid card services-filters" data-reveal="up">
        <div className="field">
          <label htmlFor="cat">Тип часов</label>
          <select
            id="cat"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as WatchCategory | "all")
            }
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="repair">Вид ремонта</label>
          <select
            id="repair"
            value={repairType}
            onChange={(event) =>
              setRepairType(event.target.value as RepairType | "all")
            }
          >
            {repairTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="min">Мин. цена</label>
          <input
            id="min"
            type="number"
            min={0}
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="max">Макс. цена</label>
          <input
            id="max"
            type="number"
            min={0}
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
      </div>

      <div className="cards-grid service-cards-grid">
        {loading
          ? skeletonCards.map((item) => (
              <article
                key={`skeleton-${item}`}
                className="card service-card services-card services-card-skeleton"
                aria-hidden="true"
              >
                <div className="card-spark service-skeleton-spark" />
                <div className="badge-row">
                  <span className="service-skeleton-chip" />
                  <span className="service-skeleton-chip" />
                </div>
                <div className="service-skeleton-line service-skeleton-line-title" />
                <div className="service-skeleton-line" />
                <div className="service-skeleton-line service-skeleton-line-short" />
                <div className="service-skeleton-footer">
                  <span className="service-skeleton-line service-skeleton-line-price" />
                  <span className="service-skeleton-button" />
                </div>
              </article>
            ))
          : services.map((service, index) => (
              <article
                key={service.id}
                className="card service-card services-card"
                data-reveal="up"
                style={{ ["--delay" as string]: `${index * 70}ms` }}
              >
                <div className="card-spark" aria-hidden="true" />
                <div className="badge-row">
                  <span className="small-badge">
                    {getCategoryLabel(service.category)}
                  </span>
                  <span className="small-badge">
                    {getRepairTypeLabel(service.repairType)}
                  </span>
                </div>
                <h3>{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="actions-row">
                  <span className="price">от {formatCurrency(service.price)}</span>
                  <Link
                    href={`/booking?serviceId=${service.id}`}
                    className="cta-button small"
                  >
                    Записаться
                  </Link>
                </div>
              </article>
            ))}
      </div>

      {!loading && services.length === 0 ? (
        <div className="empty-state">
          Ничего не найдено по выбранным фильтрам. Попробуйте расширить диапазон
          цены.
        </div>
      ) : null}
    </>
  );
}
