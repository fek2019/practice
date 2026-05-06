import {
  AdminStats,
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  Master,
  QuickRequest,
  Service,
  ServiceFilters,
  User,
  UserRole
} from "@/types";
import { conflict, notFound } from "../errors";
import { sendClientNotification, sendMasterNotification } from "../notifications";
import { getDb } from "../db/sqlite";
import { generateId, getWorkshopSlots } from "./workshop-rules";
import { CreateQuickRequestInput, WorkshopRepository } from "./types";

// ============================================================================
// Row types — то, как BetterSqlite возвращает строки (snake_case колонки).
// ============================================================================

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Service["category"];
  repair_type: Service["repairType"];
  image_url: string;
};

type MasterRow = {
  id: string;
  name: string;
  photo: string;
  specialization: Master["specialization"];
  experience: number;
  rating: number;
  available: number; // SQLite stores boolean as 0/1
  bio: string;
};

type AppointmentRow = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  service_id: string;
  master_id: string;
  date: string;
  time_slot: string;
  status: AppointmentStatus;
  created_at: string;
};

type UserRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  password_hash: string | null;
  linked_master_id: string | null;
};

type QuickRequestRow = {
  id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  created_at: string;
};

// ============================================================================
// Row → domain mappers
// ============================================================================

const toService = (row: ServiceRow): Service => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  category: row.category,
  repairType: row.repair_type,
  imageUrl: row.image_url
});

const toMaster = (row: MasterRow): Master => ({
  id: row.id,
  name: row.name,
  photo: row.photo,
  specialization: row.specialization,
  experience: Number(row.experience),
  rating: Number(row.rating),
  available: Boolean(row.available),
  bio: row.bio
});

const toAppointment = (row: AppointmentRow): Appointment => ({
  id: row.id,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  clientEmail: row.client_email,
  serviceId: row.service_id,
  masterId: row.master_id,
  date: row.date,
  timeSlot: row.time_slot,
  status: row.status,
  createdAt: row.created_at
});

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  phone: row.phone ?? "",
  email: row.email ?? "",
  role: row.role,
  passwordHash: row.password_hash ?? undefined,
  appointments: [],
  linkedMasterId: row.linked_master_id ?? undefined
});

const toQuickRequest = (row: QuickRequestRow): QuickRequest => ({
  id: row.id,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  serviceName: row.service_name,
  createdAt: row.created_at
});

// ============================================================================
// Helpers
// ============================================================================

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Error &&
  // better-sqlite3 throws SqliteError with code 'SQLITE_CONSTRAINT_UNIQUE'
  ((error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE" ||
    /UNIQUE constraint failed/i.test(error.message));

const chooseBestMaster = (date: string, timeSlot: string): string | null => {
  const db = getDb();

  // Доступные мастера, исключая занятых в данный слот.
  const rows = db
    .prepare(
      `
      SELECT m.id AS id,
             (SELECT COUNT(*) FROM appointments a WHERE a.master_id = m.id) AS load
      FROM masters m
      WHERE m.available = 1
        AND NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.master_id = m.id
            AND a.date = ?
            AND a.time_slot = ?
            AND a.status <> 'done'
        )
      ORDER BY load ASC, m.id ASC
      LIMIT 1
      `
    )
    .get(date, timeSlot) as { id: string; load: number } | undefined;

  return rows?.id ?? null;
};

// ============================================================================
// Repository
// ============================================================================

export const sqliteRepository: WorkshopRepository = {
  // -------------------------------- services --------------------------------
  async listServices(filters?: ServiceFilters) {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.category && filters.category !== "all") {
      conditions.push("category = ?");
      params.push(filters.category);
    }
    if (filters?.repairType && filters.repairType !== "all") {
      conditions.push("repair_type = ?");
      params.push(filters.repairType);
    }
    if (filters?.minPrice !== undefined) {
      conditions.push("price >= ?");
      params.push(filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      conditions.push("price <= ?");
      params.push(filters.maxPrice);
    }

    const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    const rows = db
      .prepare(`SELECT * FROM services${where} ORDER BY created_at DESC`)
      .all(...params) as ServiceRow[];
    return rows.map(toService);
  },

  async getServiceById(serviceId: string) {
    const row = getDb()
      .prepare(`SELECT * FROM services WHERE id = ?`)
      .get(serviceId) as ServiceRow | undefined;
    return row ? toService(row) : null;
  },

  async createService(input: Omit<Service, "id">) {
    const db = getDb();
    const id = generateId("srv");
    db.prepare(
      `INSERT INTO services (id, name, description, price, category, repair_type, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, input.name, input.description, input.price, input.category, input.repairType, input.imageUrl);

    const row = db.prepare(`SELECT * FROM services WHERE id = ?`).get(id) as ServiceRow;
    return toService(row);
  },

  async updateService(serviceId: string, patch: Partial<Omit<Service, "id">>) {
    const db = getDb();
    const sets: string[] = [];
    const params: unknown[] = [];

    if (patch.name !== undefined) { sets.push("name = ?"); params.push(patch.name); }
    if (patch.description !== undefined) { sets.push("description = ?"); params.push(patch.description); }
    if (patch.price !== undefined) { sets.push("price = ?"); params.push(patch.price); }
    if (patch.category !== undefined) { sets.push("category = ?"); params.push(patch.category); }
    if (patch.repairType !== undefined) { sets.push("repair_type = ?"); params.push(patch.repairType); }
    if (patch.imageUrl !== undefined) { sets.push("image_url = ?"); params.push(patch.imageUrl); }

    if (sets.length > 0) {
      params.push(serviceId);
      const result = db.prepare(`UPDATE services SET ${sets.join(", ")} WHERE id = ?`).run(...params);
      if (result.changes === 0) {
        throw notFound("Услуга не найдена");
      }
    } else {
      // Если patch пустой — просто проверяем существование
      const exists = db.prepare(`SELECT 1 FROM services WHERE id = ?`).get(serviceId);
      if (!exists) throw notFound("Услуга не найдена");
    }

    const row = db.prepare(`SELECT * FROM services WHERE id = ?`).get(serviceId) as ServiceRow;
    return toService(row);
  },

  async deleteService(serviceId: string) {
    const result = getDb().prepare(`DELETE FROM services WHERE id = ?`).run(serviceId);
    if (result.changes === 0) {
      throw notFound("Услуга не найдена");
    }
  },

  // -------------------------------- masters ---------------------------------
  async listMasters(onlyAvailable = false) {
    const where = onlyAvailable ? ` WHERE available = 1` : "";
    const rows = getDb()
      .prepare(`SELECT * FROM masters${where} ORDER BY created_at DESC`)
      .all() as MasterRow[];
    return rows.map(toMaster);
  },

  async getMasterById(masterId: string) {
    const row = getDb()
      .prepare(`SELECT * FROM masters WHERE id = ?`)
      .get(masterId) as MasterRow | undefined;
    return row ? toMaster(row) : null;
  },

  async createMaster(input: Omit<Master, "id">) {
    const db = getDb();
    const id = generateId("m");
    db.prepare(
      `INSERT INTO masters (id, name, photo, specialization, experience, rating, available, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.name,
      input.photo,
      input.specialization,
      input.experience,
      input.rating,
      input.available ? 1 : 0,
      input.bio
    );

    const row = db.prepare(`SELECT * FROM masters WHERE id = ?`).get(id) as MasterRow;
    return toMaster(row);
  },

  async updateMaster(masterId: string, patch: Partial<Omit<Master, "id">>) {
    const db = getDb();
    const sets: string[] = [];
    const params: unknown[] = [];

    if (patch.name !== undefined) { sets.push("name = ?"); params.push(patch.name); }
    if (patch.photo !== undefined) { sets.push("photo = ?"); params.push(patch.photo); }
    if (patch.specialization !== undefined) { sets.push("specialization = ?"); params.push(patch.specialization); }
    if (patch.experience !== undefined) { sets.push("experience = ?"); params.push(patch.experience); }
    if (patch.rating !== undefined) { sets.push("rating = ?"); params.push(patch.rating); }
    if (patch.available !== undefined) { sets.push("available = ?"); params.push(patch.available ? 1 : 0); }
    if (patch.bio !== undefined) { sets.push("bio = ?"); params.push(patch.bio); }

    if (sets.length > 0) {
      params.push(masterId);
      const result = db.prepare(`UPDATE masters SET ${sets.join(", ")} WHERE id = ?`).run(...params);
      if (result.changes === 0) {
        throw notFound("Мастер не найден");
      }
    } else {
      const exists = db.prepare(`SELECT 1 FROM masters WHERE id = ?`).get(masterId);
      if (!exists) throw notFound("Мастер не найден");
    }

    const row = db.prepare(`SELECT * FROM masters WHERE id = ?`).get(masterId) as MasterRow;
    return toMaster(row);
  },

  async deleteMaster(masterId: string) {
    const result = getDb().prepare(`DELETE FROM masters WHERE id = ?`).run(masterId);
    if (result.changes === 0) {
      throw notFound("Мастер не найден");
    }
  },

  // ----------------------------- quick requests -----------------------------
  async createQuickRequest(input: CreateQuickRequestInput) {
    const db = getDb();
    const id = generateId("qr");
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO quick_requests (id, client_name, client_phone, service_name, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, input.clientName, input.clientPhone, input.serviceName, createdAt);

    const row = db.prepare(`SELECT * FROM quick_requests WHERE id = ?`).get(id) as QuickRequestRow;
    return toQuickRequest(row);
  },

  // -------------------------------- slots -----------------------------------
  async getAvailableSlots(date: string, masterId?: string | null) {
    const db = getDb();
    const slots = getWorkshopSlots();

    const availableMasterCount = (db
      .prepare(`SELECT COUNT(*) AS count FROM masters WHERE available = 1`)
      .get() as { count: number }).count;

    if (availableMasterCount === 0) {
      return [];
    }

    if (masterId && masterId !== "any") {
      const busyRows = db
        .prepare(
          `SELECT time_slot FROM appointments
           WHERE master_id = ? AND date = ? AND status <> 'done'`
        )
        .all(masterId, date) as Array<{ time_slot: string }>;
      const busy = new Set(busyRows.map((row) => row.time_slot));
      return slots.filter((slot) => !busy.has(slot));
    }

    // Свободно если кол-во активных записей в слоте < число доступных мастеров.
    const busyRows = db
      .prepare(
        `SELECT time_slot, COUNT(*) AS busy
         FROM appointments
         WHERE date = ? AND status <> 'done'
         GROUP BY time_slot`
      )
      .all(date) as Array<{ time_slot: string; busy: number }>;

    const busyMap = new Map(busyRows.map((row) => [row.time_slot, Number(row.busy)]));
    return slots.filter((slot) => (busyMap.get(slot) ?? 0) < availableMasterCount);
  },

  // ----------------------------- appointments -------------------------------
  async createAppointment(input: CreateAppointmentInput) {
    const db = getDb();

    // Pre-checks (за пределами транзакции, т.к. могут вызывать побочные эффекты)
    const serviceRow = db.prepare(`SELECT id FROM services WHERE id = ?`).get(input.serviceId);
    if (!serviceRow) {
      throw notFound("Услуга не найдена");
    }

    const availableSlots = await this.getAvailableSlots(input.date, input.masterId);
    if (!availableSlots.includes(input.timeSlot)) {
      throw conflict("Выбранный слот уже занят");
    }

    let masterId = input.masterId || null;
    if (!masterId || masterId === "any") {
      masterId = chooseBestMaster(input.date, input.timeSlot);
    }
    if (!masterId) {
      throw conflict("Нет свободных мастеров на выбранное время");
    }

    const id = generateId("a");
    const createdAt = new Date().toISOString();

    // Транзакция: вставить запись, ловить уникальный индекс на (master, date, slot, active).
    const insertAppointment = db.prepare(
      `INSERT INTO appointments (id, client_name, client_phone, client_email, service_id, master_id, date, time_slot, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    );

    try {
      insertAppointment.run(
        id,
        input.clientName,
        input.clientPhone,
        input.clientEmail,
        input.serviceId,
        masterId,
        input.date,
        input.timeSlot,
        createdAt
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        // Race condition: слот занят между checkSlots и insert.
        throw conflict("Выбранный слот уже занят");
      }
      throw error;
    }

    const row = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(id) as AppointmentRow;
    const appointment = toAppointment(row);

    // Создаём/находим клиентского пользователя (без падения транзакции).
    try {
      await this.createClientUser({
        name: appointment.clientName,
        phone: appointment.clientPhone,
        email: appointment.clientEmail
      });
    } catch {
      // ignore — пользователь мог уже существовать с конфликтующим контактом
    }

    await sendClientNotification(
      appointment.clientPhone,
      `Заявка ${appointment.id} принята. Дата: ${appointment.date}, время: ${appointment.timeSlot}.`
    );
    await sendMasterNotification(
      masterId,
      `Новая заявка ${appointment.id} на ${appointment.date} ${appointment.timeSlot}.`
    );

    return appointment;
  },

  async getAppointmentById(appointmentId: string) {
    const row = getDb()
      .prepare(`SELECT * FROM appointments WHERE id = ?`)
      .get(appointmentId) as AppointmentRow | undefined;
    return row ? toAppointment(row) : null;
  },

  async listClientAppointments(query: { phone?: string; email?: string }) {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.phone) {
      conditions.push("client_phone = ?");
      params.push(query.phone);
    }
    if (query.email) {
      conditions.push("client_email = ?");
      params.push(query.email);
    }

    if (conditions.length === 0) {
      return [];
    }

    const where = ` WHERE ${conditions.join(" OR ")}`;
    const rows = db
      .prepare(`SELECT * FROM appointments${where} ORDER BY date DESC, time_slot DESC`)
      .all(...params) as AppointmentRow[];
    return rows.map(toAppointment);
  },

  async listMasterAppointments(masterId: string) {
    const rows = getDb()
      .prepare(
        `SELECT * FROM appointments WHERE master_id = ? ORDER BY date ASC, time_slot ASC`
      )
      .all(masterId) as AppointmentRow[];
    return rows.map(toAppointment);
  },

  async listAllAppointments() {
    const rows = getDb()
      .prepare(`SELECT * FROM appointments ORDER BY created_at DESC`)
      .all() as AppointmentRow[];
    return rows.map(toAppointment);
  },

  async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    const db = getDb();
    const result = db
      .prepare(`UPDATE appointments SET status = ? WHERE id = ?`)
      .run(status, appointmentId);

    if (result.changes === 0) {
      throw notFound("Заявка не найдена");
    }

    const row = db
      .prepare(`SELECT * FROM appointments WHERE id = ?`)
      .get(appointmentId) as AppointmentRow;
    const appointment = toAppointment(row);

    if (status === "ready") {
      await sendClientNotification(appointment.clientPhone, "Ваши часы готовы к выдаче.");
    }

    return appointment;
  },

  // -------------------------------- stats -----------------------------------
  async getAdminStats(): Promise<AdminStats> {
    const db = getDb();

    const totalAppointments = (db
      .prepare(`SELECT COUNT(*) AS count FROM appointments`)
      .get() as { count: number }).count;

    const totalRevenueRow = db
      .prepare(
        `SELECT COALESCE(SUM(s.price), 0) AS revenue
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         WHERE a.status = 'done'`
      )
      .get() as { revenue: number };

    const popularServices = (db
      .prepare(
        `SELECT a.service_id AS serviceId,
                COALESCE(s.name, 'Неизвестная услуга') AS serviceName,
                COUNT(*) AS bookings
         FROM appointments a
         LEFT JOIN services s ON s.id = a.service_id
         GROUP BY a.service_id
         ORDER BY bookings DESC`
      )
      .all() as Array<{ serviceId: string; serviceName: string; bookings: number }>).map((row) => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      bookings: Number(row.bookings)
    }));

    const masterLoad = (db
      .prepare(
        `SELECT m.id AS masterId,
                m.name AS masterName,
                COALESCE(COUNT(a.id), 0) AS orders
         FROM masters m
         LEFT JOIN appointments a ON a.master_id = m.id
         GROUP BY m.id, m.name
         ORDER BY m.created_at DESC`
      )
      .all() as Array<{ masterId: string; masterName: string; orders: number }>).map((row) => ({
      masterId: row.masterId,
      masterName: row.masterName,
      orders: Number(row.orders)
    }));

    return {
      totalAppointments: Number(totalAppointments),
      totalRevenue: Number(totalRevenueRow.revenue ?? 0),
      popularServices,
      masterLoad
    };
  },

  // -------------------------------- users -----------------------------------
  async getUserByEmail(email: string) {
    const row = getDb()
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .get(email) as UserRow | undefined;
    return row ? toUser(row) : null;
  },

  async getUserByPhone(phone: string) {
    const row = getDb()
      .prepare(`SELECT * FROM users WHERE phone = ?`)
      .get(phone) as UserRow | undefined;
    return row ? toUser(row) : null;
  },

  async getFirstUserByRole(role: UserRole) {
    const row = getDb()
      .prepare(`SELECT * FROM users WHERE role = ? ORDER BY created_at ASC LIMIT 1`)
      .get(role) as UserRow | undefined;
    return row ? toUser(row) : null;
  },

  async createClientUser(input: { name: string; phone?: string; email?: string; passwordHash?: string }) {
    const db = getDb();

    // Идемпотентность: возвращаем существующего, если контакт уже есть.
    if (input.phone) {
      const existing = await this.getUserByPhone(input.phone);
      if (existing) return existing;
    }
    if (input.email) {
      const existing = await this.getUserByEmail(input.email);
      if (existing) return existing;
    }

    const id = generateId("u");
    try {
      db.prepare(
        `INSERT INTO users (id, name, phone, email, role, password_hash)
         VALUES (?, ?, ?, ?, 'client', ?)`
      ).run(
        id,
        input.name,
        input.phone || null,
        input.email || null,
        input.passwordHash || null
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        // Гонка: между двумя проверками — один из контактов оказался занят.
        // Попробуем вернуть существующего.
        if (input.phone) {
          const existing = await this.getUserByPhone(input.phone);
          if (existing) return existing;
        }
        if (input.email) {
          const existing = await this.getUserByEmail(input.email);
          if (existing) return existing;
        }
        throw conflict("Пользователь с такими данными уже существует");
      }
      throw error;
    }

    const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow;
    return toUser(row);
  }
};
