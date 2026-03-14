"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { getSession } from "@/lib/stubs/auth";
import {
  adminCreateMaster,
  adminCreateService,
  adminDeleteMaster,
  adminDeleteService,
  adminSetServicePrice,
  adminUpdateMaster,
  adminUpdateService,
  getAdminStats,
  listAllAppointments,
  listMasters,
  listServices
} from "@/lib/stubs/api";
import { AdminStats, Appointment, AuthSession, Master, RepairType, Service, WatchCategory } from "@/types";

const emptyService: Omit<Service, "id"> = {
  name: "",
  description: "",
  price: 0,
  category: "mechanical",
  repairType: "cleaning",
  imageUrl: ""
};

const emptyMaster: Omit<Master, "id"> = {
  name: "",
  photo: "",
  specialization: "universal",
  experience: 1,
  rating: 4.5,
  available: true,
  bio: ""
};

export function AdminDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [serviceForm, setServiceForm] = useState<Omit<Service, "id">>(emptyService);
  const [masterForm, setMasterForm] = useState<Omit<Master, "id">>(emptyMaster);
  const [priceEditor, setPriceEditor] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSession(getSession());
  }, []);

  const reload = useCallback(async () => {
    const [statsData, serviceData, masterData, appointmentData] = await Promise.all([
      getAdminStats(),
      listServices(),
      listMasters(),
      listAllAppointments()
    ]);
    setStats(statsData);
    setServices(serviceData);
    setMasters(masterData);
    setAppointments(appointmentData);
    setPriceEditor(
      Object.fromEntries(serviceData.map((service) => [service.id, service.price.toString()])) as Record<string, string>
    );
  }, []);

  useEffect(() => {
    if (!session || session.role !== "admin") {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    };
    load();
  }, [session, reload]);

  const maxPopular = useMemo(() => Math.max(...(stats?.popularServices.map((item) => item.bookings) ?? [1])), [stats]);
  const maxMasterLoad = useMemo(() => Math.max(...(stats?.masterLoad.map((item) => item.orders) ?? [1])), [stats]);

  const clearStateMessages = () => {
    setError("");
    setMessage("");
  };

  const withRefresh = async (action: () => Promise<void>, successText: string) => {
    clearStateMessages();
    try {
      await action();
      await reload();
      setMessage(successText);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Операция завершилась с ошибкой.");
    }
  };

  const onCreateService = async (event: FormEvent) => {
    event.preventDefault();
    await withRefresh(
      async () => {
        if (!serviceForm.name || !serviceForm.description || !serviceForm.imageUrl || serviceForm.price <= 0) {
          throw new Error("Заполните форму услуги полностью.");
        }
        await adminCreateService(serviceForm);
        setServiceForm(emptyService);
      },
      "Услуга добавлена."
    );
  };

  const onCreateMaster = async (event: FormEvent) => {
    event.preventDefault();
    await withRefresh(
      async () => {
        if (!masterForm.name || !masterForm.photo || !masterForm.bio || masterForm.experience <= 0) {
          throw new Error("Заполните форму мастера полностью.");
        }
        await adminCreateMaster(masterForm);
        setMasterForm(emptyMaster);
      },
      "Мастер добавлен."
    );
  };

  if (!session || session.role !== "admin") {
    return (
      <div className="empty-state">
        Доступ запрещен. Для входа в админку используйте `/account` и войдите под `admin@watchlab.local` / `admin123`.
      </div>
    );
  }

  if (loading || !stats) {
    return <p className="hint">Загружаем админ-панель...</p>;
  }

  return (
    <div className="panel admin-dashboard-shell" data-reveal="up">
      <h2>Личный кабинет администратора</h2>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        Управляйте услугами, мастерами и ценами. Статистика строится по коллекции заявок (mock).
      </p>

      <div className="stats-grid">
        <article className="stat-card">
          <p>Количество записей</p>
          <strong className="value">{stats.totalAppointments}</strong>
        </article>
        <article className="stat-card">
          <p>Выручка (завершенные)</p>
          <strong className="value">{formatCurrency(stats.totalRevenue)}</strong>
        </article>
        <article className="stat-card">
          <p>Услуг в каталоге</p>
          <strong className="value">{services.length}</strong>
        </article>
      </div>

      <div className="dashboard-grid" style={{ marginTop: "1rem" }}>
        <article className="card">
          <h3>Популярные услуги</h3>
          <div className="bar-chart">
            {stats.popularServices.map((item) => (
              <div className="bar-item" key={item.serviceId}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.serviceName}</span>
                  <strong>{item.bookings}</strong>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${(item.bookings / maxPopular) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h3>Загрузка мастеров</h3>
          <div className="bar-chart">
            {stats.masterLoad.map((item) => (
              <div className="bar-item" key={item.masterId}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.masterName}</span>
                  <strong>{item.orders}</strong>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${(item.orders / maxMasterLoad) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section style={{ marginTop: "1.4rem" }}>
        <h3>Управление услугами (CRUD)</h3>
        <form className="card form-grid" onSubmit={onCreateService}>
          <div className="field">
            <label htmlFor="srv-name">Название</label>
            <input
              id="srv-name"
              value={serviceForm.name}
              onChange={(event) => setServiceForm((state) => ({ ...state, name: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="srv-desc">Описание</label>
            <textarea
              id="srv-desc"
              rows={3}
              value={serviceForm.description}
              onChange={(event) => setServiceForm((state) => ({ ...state, description: event.target.value }))}
            />
          </div>
          <div className="filters-grid">
            <div className="field">
              <label htmlFor="srv-price">Цена</label>
              <input
                id="srv-price"
                type="number"
                min={0}
                value={serviceForm.price}
                onChange={(event) =>
                  setServiceForm((state) => ({ ...state, price: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="srv-cat">Категория</label>
              <select
                id="srv-cat"
                value={serviceForm.category}
                onChange={(event) =>
                  setServiceForm((state) => ({ ...state, category: event.target.value as WatchCategory }))
                }
              >
                <option value="mechanical">mechanical</option>
                <option value="quartz">quartz</option>
                <option value="smart">smart</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="srv-type">Тип ремонта</label>
              <select
                id="srv-type"
                value={serviceForm.repairType}
                onChange={(event) =>
                  setServiceForm((state) => ({ ...state, repairType: event.target.value as RepairType }))
                }
              >
                <option value="glass">glass</option>
                <option value="cleaning">cleaning</option>
                <option value="restoration">restoration</option>
                <option value="battery">battery</option>
                <option value="waterproofing">waterproofing</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="srv-img">Ссылка на фото</label>
              <input
                id="srv-img"
                value={serviceForm.imageUrl}
                onChange={(event) => setServiceForm((state) => ({ ...state, imageUrl: event.target.value }))}
              />
            </div>
          </div>
          <button className="cta-button" type="submit">
            Добавить услугу
          </button>
        </form>

        <div className="table-wrap card" style={{ marginTop: "0.8rem" }}>
          <table>
            <thead>
              <tr>
                <th>Услуга</th>
                <th>Цена</th>
                <th>Управление</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{service.name}</td>
                  <td>
                    <input
                      style={{ maxWidth: "120px" }}
                      type="number"
                      value={priceEditor[service.id] ?? service.price}
                      onChange={(event) =>
                        setPriceEditor((state) => ({ ...state, [service.id]: event.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <div className="actions-row">
                      <button
                        type="button"
                        className="cta-button small"
                        onClick={() =>
                          withRefresh(
                            async () => {
                              await adminSetServicePrice(service.id, Number(priceEditor[service.id] ?? service.price));
                            },
                            "Цена обновлена."
                          )
                        }
                      >
                        Сохранить цену
                      </button>
                      <button
                        type="button"
                        className="outline-button dark"
                        onClick={() =>
                          withRefresh(
                            async () => {
                              await adminDeleteService(service.id);
                            },
                            "Услуга удалена."
                          )
                        }
                      >
                        Удалить
                      </button>
                      <button
                        type="button"
                        className="outline-button dark"
                        onClick={() =>
                          withRefresh(
                            async () => {
                              await adminUpdateService(service.id, { description: `${service.description} (обновлено)` });
                            },
                            "Описание обновлено."
                          )
                        }
                      >
                        Быстрое редакт.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: "1.6rem" }}>
        <h3>Управление мастерами (CRUD)</h3>
        <form className="card form-grid" onSubmit={onCreateMaster}>
          <div className="field">
            <label htmlFor="m-name">Имя</label>
            <input
              id="m-name"
              value={masterForm.name}
              onChange={(event) => setMasterForm((state) => ({ ...state, name: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="m-photo">Фото URL</label>
            <input
              id="m-photo"
              value={masterForm.photo}
              onChange={(event) => setMasterForm((state) => ({ ...state, photo: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="m-bio">Описание</label>
            <textarea
              id="m-bio"
              rows={3}
              value={masterForm.bio}
              onChange={(event) => setMasterForm((state) => ({ ...state, bio: event.target.value }))}
            />
          </div>
          <div className="filters-grid">
            <div className="field">
              <label htmlFor="m-spec">Специализация</label>
              <select
                id="m-spec"
                value={masterForm.specialization}
                onChange={(event) =>
                  setMasterForm((state) => ({
                    ...state,
                    specialization: event.target.value as Master["specialization"]
                  }))
                }
              >
                <option value="mechanical">mechanical</option>
                <option value="quartz">quartz</option>
                <option value="smart">smart</option>
                <option value="universal">universal</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="m-exp">Опыт (лет)</label>
              <input
                id="m-exp"
                type="number"
                min={1}
                value={masterForm.experience}
                onChange={(event) =>
                  setMasterForm((state) => ({ ...state, experience: Number(event.target.value) || 1 }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="m-rate">Рейтинг</label>
              <input
                id="m-rate"
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={masterForm.rating}
                onChange={(event) => setMasterForm((state) => ({ ...state, rating: Number(event.target.value) || 4.5 }))}
              />
            </div>
            <div className="field">
              <label htmlFor="m-avail">Доступность</label>
              <select
                id="m-avail"
                value={masterForm.available ? "true" : "false"}
                onChange={(event) =>
                  setMasterForm((state) => ({ ...state, available: event.target.value === "true" }))
                }
              >
                <option value="true">Доступен</option>
                <option value="false">Недоступен</option>
              </select>
            </div>
          </div>
          <button className="cta-button" type="submit">
            Добавить мастера
          </button>
        </form>

        <div className="table-wrap card" style={{ marginTop: "0.8rem" }}>
          <table>
            <thead>
              <tr>
                <th>Мастер</th>
                <th>Специализация</th>
                <th>Доступность</th>
                <th>Управление</th>
              </tr>
            </thead>
            <tbody>
              {masters.map((master) => (
                <tr key={master.id}>
                  <td>{master.name}</td>
                  <td>{master.specialization}</td>
                  <td>{master.available ? "Да" : "Нет"}</td>
                  <td>
                    <div className="actions-row">
                      <button
                        type="button"
                        className="cta-button small"
                        onClick={() =>
                          withRefresh(
                            async () => {
                              await adminUpdateMaster(master.id, { available: !master.available });
                            },
                            "Статус доступности обновлен."
                          )
                        }
                      >
                        Переключить доступ
                      </button>
                      <button
                        type="button"
                        className="outline-button dark"
                        onClick={() =>
                          withRefresh(
                            async () => {
                              await adminDeleteMaster(master.id);
                            },
                            "Мастер удален."
                          )
                        }
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: "1.6rem" }}>
        <h3>Последние записи</h3>
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Дата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 10).map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.id}</td>
                  <td>{appointment.clientName}</td>
                  <td>
                    {appointment.date} {appointment.timeSlot}
                  </td>
                  <td>{appointment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}
      <p className="hint" style={{ marginTop: "0.9rem" }}>
        Все действия идут в mock API. Точки интеграции backend: `src/lib/stubs/api.ts` и `src/lib/stubs/auth.ts`.
      </p>
    </div>
  );
}
