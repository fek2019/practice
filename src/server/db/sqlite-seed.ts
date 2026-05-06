import type DatabaseCtor from "better-sqlite3";
import { mockDb } from "@/lib/stubs/data";
import { hashPassword } from "../security/password";

type BetterSqliteDatabase = InstanceType<typeof DatabaseCtor>;

// Сид выполняется только если соответствующая таблица пуста.
// Это позволяет безопасно повторно запускать инициализацию: добавленные
// пользователем записи не перезаписываются и не дублируются.

const isEmpty = (database: BetterSqliteDatabase, table: string): boolean => {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
  return row.count === 0;
};

const seedServices = (database: BetterSqliteDatabase) => {
  if (!isEmpty(database, "services")) return;

  const insert = database.prepare(`
    INSERT INTO services (id, name, description, price, category, repair_type, image_url)
    VALUES (@id, @name, @description, @price, @category, @repairType, @imageUrl)
  `);

  const tx = database.transaction(() => {
    for (const service of mockDb.services) {
      insert.run(service);
    }
  });
  tx();
};

const seedMasters = (database: BetterSqliteDatabase) => {
  if (!isEmpty(database, "masters")) return;

  const insert = database.prepare(`
    INSERT INTO masters (id, name, photo, specialization, experience, rating, available, bio)
    VALUES (@id, @name, @photo, @specialization, @experience, @rating, @available, @bio)
  `);

  const tx = database.transaction(() => {
    for (const master of mockDb.masters) {
      insert.run({
        id: master.id,
        name: master.name,
        photo: master.photo,
        specialization: master.specialization,
        experience: master.experience,
        rating: master.rating,
        available: master.available ? 1 : 0,
        bio: master.bio
      });
    }
  });
  tx();
};

const seedUsers = (database: BetterSqliteDatabase) => {
  if (!isEmpty(database, "users")) return;

  const insert = database.prepare(`
    INSERT INTO users (id, name, phone, email, role, password_hash, linked_master_id)
    VALUES (@id, @name, @phone, @email, @role, @passwordHash, @linkedMasterId)
  `);

  const tx = database.transaction(() => {
    for (const user of mockDb.users) {
      // mockDb users contain plaintext password; we hash it once at seed time.
      const passwordHash = user.password ? hashPassword(user.password) : null;
      insert.run({
        id: user.id,
        name: user.name,
        phone: user.phone || null,
        email: user.email || null,
        role: user.role,
        passwordHash,
        linkedMasterId: user.linkedMasterId ?? null
      });
    }
  });
  tx();
};

const seedAppointments = (database: BetterSqliteDatabase) => {
  if (!isEmpty(database, "appointments")) return;

  const insert = database.prepare(`
    INSERT INTO appointments (id, client_name, client_phone, client_email, service_id, master_id, date, time_slot, status, created_at)
    VALUES (@id, @clientName, @clientPhone, @clientEmail, @serviceId, @masterId, @date, @timeSlot, @status, @createdAt)
  `);

  const tx = database.transaction(() => {
    for (const appointment of mockDb.appointments) {
      insert.run({
        id: appointment.id,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail,
        serviceId: appointment.serviceId,
        masterId: appointment.masterId,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        status: appointment.status,
        createdAt: appointment.createdAt
      });
    }
  });
  tx();
};

export const seedDatabase = (database: BetterSqliteDatabase) => {
  // Порядок важен: masters → services → users → appointments (FK).
  seedServices(database);
  seedMasters(database);
  seedUsers(database);
  seedAppointments(database);
};
