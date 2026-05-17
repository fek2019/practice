"use client";

import { useMemo, useState } from "react";

type Location = {
  city: string;
  badge: string;
  address: string;
  metro: string;
  phone: string;
  email: string;
  parking: string;
  coordinates: { lat: number; lon: number };
};

const locations: Location[] = [
  {
    city: "Москва",
    badge: "Главная мастерская",
    address: "Москва, ул. Покровка, 12",
    metro: "Китай-город, 5 минут пешком",
    phone: "+7 (495) 200-21-37",
    email: "hello@watchlab.ru",
    parking: "Платная, во дворе БЦ",
    coordinates: { lat: 55.7588, lon: 37.6498 }
  },
  {
    city: "Санкт-Петербург",
    badge: "Сервис на Невском",
    address: "Санкт-Петербург, Невский пр., 78",
    metro: "Гостиный двор, 7 минут пешком",
    phone: "+7 (812) 200-21-37",
    email: "spb@watchlab.ru",
    parking: "Городская парковка рядом",
    coordinates: { lat: 59.9311, lon: 30.3609 }
  },
  {
    city: "Казань",
    badge: "Региональный центр",
    address: "Казань, ул. Баумана, 44",
    metro: "Площадь Тукая, 3 минуты пешком",
    phone: "+7 (843) 200-21-37",
    email: "kazan@watchlab.ru",
    parking: "Подземная парковка ТЦ",
    coordinates: { lat: 55.7879, lon: 49.1213 }
  }
];

const schedule = [
  { day: "Понедельник - Пятница", hours: "10:00 - 21:00" },
  { day: "Суббота", hours: "11:00 - 20:00" },
  { day: "Воскресенье", hours: "12:00 - 19:00" }
];

export function LocationSwitcher() {
  const [city, setCity] = useState(locations[0].city);
  const location = useMemo(() => locations.find((item) => item.city === city) ?? locations[0], [city]);
  const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${location.coordinates.lon}%2C${location.coordinates.lat}&z=16&pt=${location.coordinates.lon}%2C${location.coordinates.lat},pm2rdm`;

  return (
    <div className="split contacts-layout">
      <article className="panel contacts-main-card" data-reveal="left">
        <div className="contacts-location-head">
          <span className="small-badge">{location.badge}</span>
          <label className="contacts-city-select">
            <span>Город</span>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              {locations.map((item) => (
                <option key={item.city} value={item.city}>
                  {item.city}
                </option>
              ))}
            </select>
          </label>
        </div>
        <h3>{location.address}</h3>
        <div className="contacts-list">
          <p>
            <strong>Метро:</strong> {location.metro}
          </p>
          <p>
            <strong>Телефон:</strong>{" "}
            <a href={`tel:${location.phone.replace(/[^+\d]/g, "")}`}>{location.phone}</a>
          </p>
          <p>
            <strong>Email:</strong> <a href={`mailto:${location.email}`}>{location.email}</a>
          </p>
        </div>
        <div className="contacts-schedule">
          <h4>Часы работы</h4>
          <ul>
            {schedule.map((item) => (
              <li key={item.day}>
                <span>{item.day}</span>
                <strong>{item.hours}</strong>
              </li>
            ))}
          </ul>
        </div>
        <p className="contacts-note hint">
          Приемка часов производится без записи, ремонт - по слоту в личном кабинете. Для дорогих калибров рекомендуем заранее согласовать визит с мастером.
        </p>
      </article>

      <article className="card contacts-map-card" data-reveal="right">
        <h3>Как нас найти</h3>
        <p className="hint">
          Для Яндекс Карт используйте координаты точки или выберите нужный город в списке.
        </p>
        <iframe
          className="contacts-map-frame"
          src={mapSrc}
          title={`Карта: ${location.city}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="contacts-map-meta">
          <div>
            <span>Координаты</span>
            <strong>
              {location.coordinates.lat.toFixed(4)}, {location.coordinates.lon.toFixed(4)}
            </strong>
          </div>
          <div>
            <span>Парковка</span>
            <strong>{location.parking}</strong>
          </div>
        </div>
      </article>
    </div>
  );
}
