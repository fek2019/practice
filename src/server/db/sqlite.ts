import { existsSync, mkdirSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";
import type DatabaseCtor from "better-sqlite3";
import { getSqliteFilePath } from "../config";

// Тип экземпляра БД — выводим из конструктора, чтобы не зависеть от
// внутренней структуры неймспейса @types/better-sqlite3.
type BetterSqliteDatabase = InstanceType<typeof DatabaseCtor>;
type Sqlite3Module = typeof DatabaseCtor;

// We import lazily inside getDb() so the native module is only required
// when the SQLite data source is actually selected. Bundlers and serverless
// stacks therefore do not need better-sqlite3 unless it is used.
let cachedSqlite3: Sqlite3Module | null = null;

const loadSqlite3 = (): Sqlite3Module => {
  if (cachedSqlite3) {
    return cachedSqlite3;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const required = require("better-sqlite3") as Sqlite3Module | { default: Sqlite3Module };
  // CJS interop guard
  cachedSqlite3 = (required as { default?: Sqlite3Module }).default ?? (required as Sqlite3Module);
  return cachedSqlite3;
};

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL CHECK (category IN ('mechanical', 'quartz', 'smart')),
  repair_type TEXT NOT NULL CHECK (repair_type IN ('glass', 'cleaning', 'restoration', 'battery', 'waterproofing')),
  image_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS masters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo TEXT NOT NULL,
  specialization TEXT NOT NULL CHECK (specialization IN ('mechanical', 'quartz', 'smart', 'universal')),
  experience INTEGER NOT NULL CHECK (experience >= 0),
  rating REAL NOT NULL CHECK (rating >= 0 AND rating <= 5),
  available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1)),
  bio TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'master', 'admin')),
  password_hash TEXT,
  linked_master_id TEXT REFERENCES masters(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  service_id TEXT NOT NULL REFERENCES services(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  master_id TEXT NOT NULL REFERENCES masters(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'ready', 'done')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS quick_requests (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Уникальный индекс: один мастер не может иметь две активные записи в один слот.
-- Записи со статусом 'done' исключаются — слот после завершения снова свободен.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_master_slot_active_uidx
  ON appointments(master_id, date, time_slot)
  WHERE status <> 'done';

CREATE INDEX IF NOT EXISTS appointments_client_phone_idx ON appointments(client_phone);
CREATE INDEX IF NOT EXISTS appointments_client_email_idx ON appointments(client_email);
CREATE INDEX IF NOT EXISTS appointments_master_date_idx ON appointments(master_id, date, time_slot);
CREATE INDEX IF NOT EXISTS services_filter_idx ON services(category, repair_type, price);
CREATE INDEX IF NOT EXISTS masters_available_idx ON masters(available);

-- Триггеры для автоматического обновления updated_at.
CREATE TRIGGER IF NOT EXISTS services_set_updated_at
AFTER UPDATE ON services
FOR EACH ROW
BEGIN
  UPDATE services SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS masters_set_updated_at
AFTER UPDATE ON masters
FOR EACH ROW
BEGIN
  UPDATE masters SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS users_set_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS appointments_set_updated_at
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
  UPDATE appointments SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = NEW.id;
END;
`;

const resolveDbPath = (): string => {
  const configured = getSqliteFilePath();
  // Special in-memory marker
  if (configured === ":memory:") {
    return ":memory:";
  }
  return isAbsolute(configured) ? configured : resolve(process.cwd(), configured);
};

const ensureDirectory = (filePath: string) => {
  if (filePath === ":memory:") return;
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

let cachedDb: BetterSqliteDatabase | null = null;
let seeded = false;

const initializeSchema = (database: BetterSqliteDatabase) => {
  database.exec(SCHEMA_SQL);
};

const seedIfEmpty = (database: BetterSqliteDatabase) => {
  if (seeded) return;
  // Lazy import seed to avoid pulling crypto-heavy code on cold start when schema already populated.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { seedDatabase } = require("./sqlite-seed") as typeof import("./sqlite-seed");
  seedDatabase(database);
  seeded = true;
};

export const getDb = (): BetterSqliteDatabase => {
  if (cachedDb) {
    return cachedDb;
  }

  const Sqlite3 = loadSqlite3();
  const filePath = resolveDbPath();
  ensureDirectory(filePath);

  const database = new Sqlite3(filePath);
  initializeSchema(database);
  seedIfEmpty(database);

  cachedDb = database;
  return cachedDb;
};

// Helpful for tests/cleanup. Not used by request handlers.
export const closeDb = () => {
  if (cachedDb) {
    cachedDb.close();
    cachedDb = null;
    seeded = false;
  }
};
