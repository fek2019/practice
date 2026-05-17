"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  adminCreateMaster,
  adminCreateService,
  adminDeleteMaster,
  adminDeleteService,
  adminDeleteUser,
  adminSetServicePrice,
  adminUpdateMaster,
  adminUpdateService,
  adminUpdateUser,
  deleteAppointment,
  getAdminStats,
  getProfile,
  listAllAppointments,
  listMasters,
  listServices,
  listUsers,
  updateAppointmentStatus,
  updateProfile
} from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";
import { formatCurrency, getStatusLabel } from "@/lib/format";
import {
  AdminStats,
  Appointment,
  AppointmentStatus,
  AuthSession,
  Master,
  RepairType,
  Service,
  User,
  WatchCategory
} from "@/types";
import { StatusBadge } from "../ui/status-badge";

const emptyService: Omit<Service, "id"> = {
  name: "",
  description: "",
  price: 0,
  category: "mechanical",
  repairType: "cleaning",
  imageUrl: "stub://service-image"
};

const emptyMaster: Omit<Master, "id"> = {
  name: "",
  photo: "stub://master-photo",
  specialization: "universal",
  experience: 1,
  rating: 4.5,
  available: true,
  bio: ""
};

const statusOptions: AppointmentStatus[] = ["pending", "in-progress", "ready", "done", "cancelled"];

export function AdminDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceForm, setServiceForm] = useState<Omit<Service, "id">>(emptyService);
  const [masterForm, setMasterForm] = useState<Omit<Master, "id">>(emptyMaster);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "" });
  const [priceEditor, setPriceEditor] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | User["role"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSession(getSession());
  }, []);

  const reload = useCallback(async () => {
    const [profileData, statsData, serviceData, masterData, appointmentData, userData] = await Promise.all([
      getProfile(),
      getAdminStats(period),
      listServices(),
      listMasters(),
      listAllAppointments(),
      listUsers()
    ]);
    setProfile(profileData);
    setStats(statsData);
    setServices(serviceData);
    setMasters(masterData);
    setAppointments(appointmentData);
    setUsers(userData);
    setProfileForm({ name: profileData.name, phone: profileData.phone, email: profileData.email });
    setPriceEditor(Object.fromEntries(serviceData.map((service) => [service.id, service.price.toString()])));
  }, [period]);

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

  const filteredUsers = useMemo(
    () => users.filter((user) => userRoleFilter === "all" || user.role === userRoleFilter),
    [users, userRoleFilter]
  );
  const maxPopular = useMemo(() => Math.max(...(stats?.popularServices.map((item) => item.bookings) ?? [1])), [stats]);
  const maxMasterLoad = useMemo(() => Math.max(...(stats?.masterLoad.map((item) => item.orders) ?? [1])), [stats]);

  const withRefresh = async (action: () => Promise<void>, successText: string) => {
    setError("");
    setMessage("");
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
    await withRefresh(async () => {
      await adminCreateService(serviceForm);
      setServiceForm(emptyService);
    }, "Услуга добавлена.");
  };

  const onCreateMaster = async (event: FormEvent) => {
    event.preventDefault();
    await withRefresh(async () => {
      await adminCreateMaster(masterForm);
      setMasterForm(emptyMaster);
    }, "Мастер добавлен.");
  };

  const onProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await withRefresh(async () => {
      await updateProfile(profileForm);
    }, "Данные аккаунта обновлены.");
  };

  if (!session || session.role !== "admin") {
    return <div className="empty-state">Доступ запрещен. Нужна роль администратора.</div>;
  }

  if (loading || !stats || !profile) {
    return <p className="hint">Загружаем админ-панель...</p>;
  }

  return (
    <div className="cabinet-shell" data-reveal="up">
      <section className="panel cabinet-profile-card">
        <div>
          <span className="small-badge">Профиль администратора</span>
          <h2>{profile.name}</h2>
          <p className="hint">{profile.email || profile.phone}</p>
        </div>
        <form className="form-grid cabinet-profile-form" onSubmit={onProfileSubmit}>
          <div className="field">
            <label htmlFor="admin-name">Имя</label>
            <input id="admin-name" value={profileForm.name} onChange={(event) => setProfileForm((state) => ({ ...state, name: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="admin-phone">Телефон</label>
            <input id="admin-phone" value={profileForm.phone} onChange={(event) => setProfileForm((state) => ({ ...state, phone: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" value={profileForm.email} onChange={(event) => setProfileForm((state) => ({ ...state, email: event.target.value }))} />
          </div>
          <button className="cta-button" type="submit">Сохранить изменения</button>
        </form>
      </section>

      <section className="card">
        <div className="cabinet-section-head">
          <h3>Статистика</h3>
          <div className="filters-grid compact-filters">
            <div className="field">
              <label htmlFor="stats-from">С</label>
              <input id="stats-from" type="date" value={period.from} onChange={(event) => setPeriod((state) => ({ ...state, from: event.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="stats-to">По</label>
              <input id="stats-to" type="date" value={period.to} onChange={(event) => setPeriod((state) => ({ ...state, to: event.target.value }))} />
            </div>
          </div>
        </div>
        <div className="stats-grid">
          <article className="stat-card">
            <p>Количество записей</p>
            <strong className="value">{stats.totalAppointments}</strong>
          </article>
          <article className="stat-card">
            <p>Выручка</p>
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
                  <div className="bar-row"><span>{item.serviceName}</span><strong>{item.bookings}</strong></div>
                  <div className="track"><div className="fill" style={{ width: `${(item.bookings / maxPopular) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </article>
          <article className="card">
            <h3>Загрузка мастеров</h3>
            <div className="bar-chart">
              {stats.masterLoad.map((item) => (
                <div className="bar-item" key={item.masterId}>
                  <div className="bar-row"><span>{item.masterName}</span><strong>{item.orders}</strong></div>
                  <div className="track"><div className="fill" style={{ width: `${(item.orders / maxMasterLoad) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="card">
        <div className="cabinet-section-head">
          <h3>Пользователи</h3>
          <div className="field compact-select">
            <label htmlFor="role-filter">Сортировка</label>
            <select id="role-filter" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value as typeof userRoleFilter)}>
              <option value="all">Все</option>
              <option value="client">Клиенты</option>
              <option value="master">Мастера</option>
              <option value="admin">Админы</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Связанный мастер</th>
                <th>Доступ</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}<br /><span className="hint">{user.email || user.phone}</span></td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(event) =>
                        withRefresh(
                          () =>
                            adminUpdateUser(user.id, {
                              role: event.target.value as User["role"],
                              linkedMasterId: event.target.value === "master" ? user.linkedMasterId : ""
                            }).then(() => undefined),
                          "Роль пользователя обновлена."
                        )
                      }
                    >
                      <option value="client">Клиент</option>
                      <option value="master">Мастер</option>
                      <option value="admin">Админ</option>
                    </select>
                  </td>
                  <td>
                    {user.role === "master" ? (
                      <select
                        value={user.linkedMasterId ?? ""}
                        onChange={(event) =>
                          withRefresh(
                            () => adminUpdateUser(user.id, { linkedMasterId: event.target.value }).then(() => undefined),
                            "Профиль мастера назначен."
                          )
                        }
                      >
                        <option value="">Не выбран</option>
                        {masters.map((master) => (
                          <option key={master.id} value={master.id}>{master.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="hint">-</span>
                    )}
                  </td>
                  <td>{user.isBanned ? "Заблокирован" : "Активен"}</td>
                  <td>
                    <div className="actions-row">
                      <button
                        type="button"
                        className="outline-button dark"
                        onClick={() =>
                          withRefresh(
                            () => adminUpdateUser(user.id, { isBanned: !user.isBanned }).then(() => undefined),
                            user.isBanned ? "Пользователь разблокирован." : "Пользователь заблокирован."
                          )
                        }
                      >
                        {user.isBanned ? "Разбанить" : "Забанить"}
                      </button>
                      <button
                        type="button"
                        className="outline-button dark"
                        onClick={() => withRefresh(() => adminDeleteUser(user.id), "Пользователь удален.")}
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

      <section className="card">
        <h3>Заказы</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Управление</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.id}</td>
                  <td>{appointment.clientName}</td>
                  <td>{appointment.date} {appointment.timeSlot}</td>
                  <td><StatusBadge status={appointment.status} /></td>
                  <td>
                    <div className="actions-row">
                      <select
                        value={appointment.status}
                        onChange={(event) =>
                          withRefresh(
                            () => updateAppointmentStatus(appointment.id, event.target.value as AppointmentStatus).then(() => undefined),
                            "Статус заявки обновлен."
                          )
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{getStatusLabel(status)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="outline-button dark"
                        onClick={() =>
                          withRefresh(
                            () => updateAppointmentStatus(appointment.id, "cancelled").then(() => undefined),
                            "Заказ отменен."
                          )
                        }
                      >
                        Отменить
                      </button>
                      <button
                        type="button"
                        className="outline-button dark"
                        onClick={() => withRefresh(() => deleteAppointment(appointment.id), "Заказ удален.")}
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

      <section className="dashboard-grid cabinet-admin-grid">
        <article className="card">
          <h3>Управление услугами</h3>
          <form className="form-grid" onSubmit={onCreateService}>
            <div className="field">
              <label htmlFor="srv-name">Название</label>
              <input id="srv-name" value={serviceForm.name} onChange={(event) => setServiceForm((state) => ({ ...state, name: event.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="srv-desc">Описание</label>
              <textarea id="srv-desc" rows={3} value={serviceForm.description} onChange={(event) => setServiceForm((state) => ({ ...state, description: event.target.value }))} />
            </div>
            <div className="filters-grid">
              <div className="field">
                <label htmlFor="srv-price">Цена</label>
                <input id="srv-price" type="number" value={serviceForm.price} onChange={(event) => setServiceForm((state) => ({ ...state, price: Number(event.target.value) || 0 }))} />
              </div>
              <div className="field">
                <label htmlFor="srv-cat">Категория</label>
                <select id="srv-cat" value={serviceForm.category} onChange={(event) => setServiceForm((state) => ({ ...state, category: event.target.value as WatchCategory }))}>
                  <option value="mechanical">mechanical</option>
                  <option value="quartz">quartz</option>
                  <option value="smart">smart</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="srv-type">Тип</label>
                <select id="srv-type" value={serviceForm.repairType} onChange={(event) => setServiceForm((state) => ({ ...state, repairType: event.target.value as RepairType }))}>
                  <option value="glass">glass</option>
                  <option value="cleaning">cleaning</option>
                  <option value="restoration">restoration</option>
                  <option value="battery">battery</option>
                  <option value="waterproofing">waterproofing</option>
                </select>
              </div>
            </div>
            <button className="cta-button" type="submit">Добавить услугу</button>
          </form>
          <div className="option-list admin-mini-list">
            {services.map((service) => (
              <article className="panel" key={service.id}>
                <h4>{service.name}</h4>
                <div className="actions-row">
                  <input value={priceEditor[service.id] ?? service.price} onChange={(event) => setPriceEditor((state) => ({ ...state, [service.id]: event.target.value }))} />
                  <button className="cta-button small" type="button" onClick={() => withRefresh(() => adminSetServicePrice(service.id, Number(priceEditor[service.id] ?? service.price)).then(() => undefined), "Цена обновлена.")}>Цена</button>
                  <button className="outline-button dark" type="button" onClick={() => withRefresh(() => adminUpdateService(service.id, { description: `${service.description} (обновлено)` }).then(() => undefined), "Услуга обновлена.")}>Редактировать</button>
                  <button className="outline-button dark" type="button" onClick={() => withRefresh(() => adminDeleteService(service.id), "Услуга удалена.")}>Удалить</button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Управление мастерами</h3>
          <form className="form-grid" onSubmit={onCreateMaster}>
            <div className="field">
              <label htmlFor="master-new-name">Имя</label>
              <input id="master-new-name" value={masterForm.name} onChange={(event) => setMasterForm((state) => ({ ...state, name: event.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="master-new-bio">Описание</label>
              <textarea id="master-new-bio" rows={3} value={masterForm.bio} onChange={(event) => setMasterForm((state) => ({ ...state, bio: event.target.value }))} />
            </div>
            <div className="filters-grid">
              <div className="field">
                <label htmlFor="master-spec">Специализация</label>
                <select id="master-spec" value={masterForm.specialization} onChange={(event) => setMasterForm((state) => ({ ...state, specialization: event.target.value as Master["specialization"] }))}>
                  <option value="mechanical">mechanical</option>
                  <option value="quartz">quartz</option>
                  <option value="smart">smart</option>
                  <option value="universal">universal</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="master-exp">Опыт</label>
                <input id="master-exp" type="number" value={masterForm.experience} onChange={(event) => setMasterForm((state) => ({ ...state, experience: Number(event.target.value) || 1 }))} />
              </div>
              <div className="field">
                <label htmlFor="master-rating">Рейтинг</label>
                <input id="master-rating" type="number" step={0.1} value={masterForm.rating} onChange={(event) => setMasterForm((state) => ({ ...state, rating: Number(event.target.value) || 4.5 }))} />
              </div>
            </div>
            <button className="cta-button" type="submit">Добавить мастера</button>
          </form>
          <div className="option-list admin-mini-list">
            {masters.map((master) => (
              <article className="panel" key={master.id}>
                <h4>{master.name}</h4>
                <div className="actions-row">
                  <button className="cta-button small" type="button" onClick={() => withRefresh(() => adminUpdateMaster(master.id, { available: !master.available }).then(() => undefined), "Доступность мастера обновлена.")}>
                    {master.available ? "Скрыть" : "Показать"}
                  </button>
                  <button className="outline-button dark" type="button" onClick={() => withRefresh(() => adminDeleteMaster(master.id), "Мастер удален.")}>Удалить</button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      {message ? <p className="notice success">{message}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}
    </div>
  );
}
