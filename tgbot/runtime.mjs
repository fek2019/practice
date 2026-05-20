import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("../", import.meta.url)));
const envPath = resolve(rootDir, "tgbot/.env");

function readEnvFile() {
  if (!existsSync(envPath)) return {};
  const entries = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    entries[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return entries;
}

const fileEnv = readEnvFile();

export function getTelegramToken() {
  return process.env.TELEGRAM_BOT_TOKEN || fileEnv.TELEGRAM_BOT_TOKEN || "";
}

function getSqlitePath() {
  const configured = process.env.APP_SQLITE_PATH || "data/watchlab.db";
  return isAbsolute(configured) ? configured : resolve(rootDir, configured);
}

function openDb() {
  const db = new Database(getSqlitePath());
  ensureTelegramSchema(db);
  return db;
}

export function ensureTelegramSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      chat_id TEXT NOT NULL UNIQUE,
      chat_username TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS telegram_subscribers_user_chat_uidx
      ON telegram_subscribers(user_id, chat_id);

    CREATE TABLE IF NOT EXISTS telegram_sent_notifications (
      notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      chat_id TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      PRIMARY KEY (notification_id, chat_id)
    );

    CREATE TABLE IF NOT EXISTS telegram_processed_updates (
      update_id INTEGER PRIMARY KEY,
      processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS telegram_bot_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const sentColumns = db.prepare("PRAGMA table_info(telegram_sent_notifications)").all();
  const hasMessageKey = sentColumns.some((column) => column.name === "message_key");
  if (!hasMessageKey) {
    db.exec("ALTER TABLE telegram_sent_notifications ADD COLUMN message_key TEXT");
  }

  db.exec(`
    UPDATE telegram_sent_notifications
    SET message_key = notification_id
    WHERE message_key IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS telegram_sent_notifications_message_key_uidx
      ON telegram_sent_notifications(chat_id, message_key)
      WHERE message_key IS NOT NULL;
  `);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function formatTelegramMessage(row) {
  const safeTitle = String(row.title || "Уведомление").trim();
  const safeMessage = String(row.message || "").trim();
  return `🔔 ${safeTitle}\n\n${safeMessage}`;
}

function getMessageKey(row) {
  const rawKey = [
    row.userId || "",
    row.appointmentId || "",
    row.kind || "",
    row.title || "",
    row.message || ""
  ].join("|");
  return createHash("sha256").update(rawKey).digest("hex");
}

async function telegramApi(method, payload) {
  const token = getTelegramToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram API ${method} failed`);
  }
  return data.result;
}

export async function sendTelegramMessage(chatId, text) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  });
}

export function linkTelegramChat({ chatId, username, email }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@") || !normalizedEmail.includes(".")) {
    return { ok: false, message: "Укажите email в формате /link email@example.com" };
  }

  const db = openDb();
  try {
    const user = db.prepare("SELECT id, email FROM users WHERE lower(email) = ?").get(normalizedEmail);
    if (!user) {
      return { ok: false, message: "Пользователь с такой почтой не найден на сайте." };
    }

    const linkedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO telegram_subscribers (user_id, email, chat_id, chat_username, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        user_id = excluded.user_id,
        email = excluded.email,
        chat_username = excluded.chat_username,
        updated_at = excluded.updated_at
    `).run(user.id, user.email, String(chatId), username || null, linkedAt);

    return { ok: true, message: `Telegram привязан к аккаунту ${user.email}.` };
  } finally {
    db.close();
  }
}

export function unlinkTelegramChat(chatId) {
  const db = openDb();
  try {
    const result = db.prepare("DELETE FROM telegram_subscribers WHERE chat_id = ?").run(String(chatId));
    return {
      ok: true,
      message: result.changes > 0 ? "Telegram отвязан от аккаунта." : "Этот чат еще не был привязан."
    };
  } finally {
    db.close();
  }
}

export async function sendDueTelegramNotifications() {
  if (!getTelegramToken()) {
    return { sent: 0, skipped: true };
  }

  const db = openDb();
  try {
    const rows = db.prepare(`
      SELECT
        n.id AS notificationId,
        n.user_id AS userId,
        n.appointment_id AS appointmentId,
        n.kind,
        n.title,
        n.message,
        s.chat_id AS chatId
      FROM notifications n
      JOIN telegram_subscribers s ON s.user_id = n.user_id
      LEFT JOIN telegram_sent_notifications sent
        ON sent.notification_id = n.id AND sent.chat_id = s.chat_id
      WHERE n.scheduled_for <= ?
        AND n.created_at > s.updated_at
        AND sent.notification_id IS NULL
      ORDER BY n.scheduled_for ASC, n.created_at ASC
      LIMIT 50
    `).all(new Date().toISOString());

    let sent = 0;
    for (const row of rows) {
      const messageKey = getMessageKey(row);
      const reserved = db.prepare(`
        INSERT OR IGNORE INTO telegram_sent_notifications (notification_id, chat_id, sent_at, message_key)
        VALUES (?, ?, ?, ?)
      `).run(row.notificationId, row.chatId, new Date().toISOString(), messageKey);

      if (reserved.changes === 0) {
        continue;
      }

      try {
        await sendTelegramMessage(row.chatId, formatTelegramMessage(row));
        sent += 1;
      } catch (error) {
        console.error("[tgbot] send failed:", error instanceof Error ? error.message : error);
      }
    }

    return { sent, skipped: false };
  } finally {
    db.close();
  }
}

export async function getUpdates(offset) {
  return telegramApi("getUpdates", {
    offset,
    timeout: 25,
    allowed_updates: ["message"]
  });
}

export function getStoredUpdateOffset() {
  const db = openDb();
  try {
    const row = db.prepare("SELECT value FROM telegram_bot_state WHERE key = 'update_offset'").get();
    return row ? Number(row.value) || 0 : 0;
  } finally {
    db.close();
  }
}

export function rememberUpdateOffset(offset) {
  const db = openDb();
  try {
    db.prepare(`
      INSERT INTO telegram_bot_state (key, value, updated_at)
      VALUES ('update_offset', ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(String(offset), new Date().toISOString());
  } finally {
    db.close();
  }
}

export function claimUpdate(updateId) {
  const db = openDb();
  try {
    const result = db.prepare(`
      INSERT OR IGNORE INTO telegram_processed_updates (update_id, processed_at)
      VALUES (?, ?)
    `).run(Number(updateId), new Date().toISOString());
    return result.changes > 0;
  } finally {
    db.close();
  }
}
