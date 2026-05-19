#!/usr/bin/env node
/**
 * setup-db.js — выполняет schema.sql и seed.sql в вашем Supabase-проекте.
 *
 * Использование:
 *   node supabase/setup-db.js
 *   node supabase/setup-db.js --only=schema
 *   node supabase/setup-db.js --only=seed
 *
 * Нужна ОДНА из двух переменных в .env.local:
 *
 *   Вариант А — Direct DB URL (рекомендуется):
 *     DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
 *     Найдёте в: Supabase Dashboard → Project Settings → Database → Connection string → URI
 *
 *   Вариант Б — Personal Access Token:
 *     SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx
 *     Получить на: https://supabase.com/dashboard/account/tokens
 *     (Это НЕ service_role key, это отдельный токен аккаунта)
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");
const http  = require("http");

// ─── .env loader ──────────────────────────────────────────────────────────────

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val   = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const root   = path.resolve(__dirname, "..");
const envArg = (process.argv.find(a => a.startsWith("--env=")) ?? "").replace("--env=", "");
if (envArg) loadEnv(path.resolve(envArg));
else { loadEnv(path.join(root, ".env.local")); loadEnv(path.join(root, ".env")); }

const args = process.argv.slice(2);
const only = (args.find(a => a.startsWith("--only=")) ?? "").replace("--only=", "") || "all";

// ─── Color helpers ────────────────────────────────────────────────────────────

const ok  = s => `\x1b[32m✅  ${s}\x1b[0m`;
const err = s => `\x1b[31m❌  ${s}\x1b[0m`;
const inf = s => `\x1b[36mℹ   ${s}\x1b[0m`;

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function request(url, body, authHeader) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const lib     = parsed.protocol === "https:" ? https : http;
    const req = lib.request({
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": payload.length,
        "Authorization":  authHeader,
      },
    }, res => {
      let data = "";
      res.on("data", c => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ─── Способ А: Management API (Personal Access Token) ─────────────────────────

function getProjectRef(url) {
  return new URL(url).hostname.split(".")[0];
}

async function runViaPAT(label, sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ref = getProjectRef(supabaseUrl);
  const url = `https://api.supabase.com/v1/projects/${ref}/database/query`;

  console.log(`\n▶  ${label} (через Personal Access Token)`);
  const { status, body } = await request(url, { query: sql }, `Bearer ${token}`);

  if (status >= 200 && status < 300) {
    console.log(ok(`Выполнено (HTTP ${status})`));
    return true;
  }
  const msg = (typeof body === "object" && (body.error || body.message)) || JSON.stringify(body);
  console.log(err(`HTTP ${status}: ${msg}`));
  return false;
}

// ─── Способ Б: REST API с service_role — прямые запросы ──────────────────────

async function runViaServiceRole(label, sql) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key         = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Supabase позволяет выполнять SQL через хранимую процедуру exec_sql
  // Но она должна существовать. Используем REST endpoint для RPC.
  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  console.log(`\n▶  ${label} (через service_role + rpc)`);
  const { status, body } = await request(url,
    { sql_query: sql },
    `Bearer ${key}`
  );

  if (status >= 200 && status < 300) {
    console.log(ok(`Выполнено (HTTP ${status})`));
    return true;
  }
  return false; // rpc может не существовать — это нормально
}

// ─── Способ В: разбиваем SQL на отдельные INSERT через REST ───────────────────
// Последний резерв: если ни PAT ни rpc не работают, объясняем как сделать вручную

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const SUPABASE_URL   = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const ACCESS_TOKEN   = process.env.SUPABASE_ACCESS_TOKEN || "";

  console.log("═══════════════════════════════════════");
  console.log("  WatchLab — инициализация базы данных ");
  console.log("═══════════════════════════════════════");
  console.log(inf(`URL: ${SUPABASE_URL}`));

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log(err("Не заданы SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY"));
    process.exit(1);
  }

  const tasks = [];
  if (only === "all" || only === "schema") tasks.push({ label: "schema.sql", file: "schema.sql" });
  if (only === "all" || only === "seed")   tasks.push({ label: "seed.sql",   file: "seed.sql"   });

  // Определяем метод
  const method = ACCESS_TOKEN ? "pat" : "manual";

  if (method === "manual") {
    console.log("\n" + err("SUPABASE_ACCESS_TOKEN не найден."));
    console.log("\n  Скрипт не может выполнить SQL напрямую без Personal Access Token.");
    console.log("  У вас два варианта:\n");
    console.log("  ── Вариант 1: добавьте токен в .env.local ─────────────────");
    console.log("  1. Откройте: https://supabase.com/dashboard/account/tokens");
    console.log("  2. Нажмите Generate new token");
    console.log("  3. Добавьте в .env.local:");
    console.log("     SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx");
    console.log("  4. Запустите: node supabase/setup-db.js\n");
    console.log("  ── Вариант 2: выполнить вручную через SQL Editor ──────────");

    for (const task of tasks) {
      const filePath = path.join(__dirname, task.file);
      if (!fs.existsSync(filePath)) continue;
      console.log(`\n  ${task.file}:`);
      console.log(`    1. Откройте https://supabase.com/dashboard/project/${getProjectRef(SUPABASE_URL)}/sql/new`);
      console.log(`    2. Скопируйте содержимое файла supabase/${task.file}`);
      console.log(`    3. Нажмите RUN`);
    }

    console.log("\n════════════════════════════════════════════\n");
    process.exit(0);
  }

  // Выполняем через PAT
  let allOk = true;
  for (const task of tasks) {
    const filePath = path.join(__dirname, task.file);
    if (!fs.existsSync(filePath)) {
      console.log(err(`Файл не найден: ${filePath}`));
      allOk = false;
      continue;
    }
    const sql = fs.readFileSync(filePath, "utf8");
    console.log(`\n▶  ${task.label}`);
    console.log(inf(`Проект: ${getProjectRef(SUPABASE_URL)}, размер: ${(sql.length / 1024).toFixed(1)} KB`));
    const success = await runViaPAT(task.label, sql);
    if (!success) allOk = false;
  }

  console.log("\n═══════════════════════════════════════");
  console.log(allOk ? ok("Готово! База данных настроена.") : err("Завершено с ошибками."));
  console.log("═══════════════════════════════════════\n");
  if (!allOk) process.exit(1);
}

main().catch(e => { console.error(err(e.message)); process.exit(1); });
