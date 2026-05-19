/**
 * test-smtp.js — диагностика SMTP подключения
 * Запуск: node test-smtp.js
 *
 * Читает .env.local (или .env), пытается отправить тестовое письмо
 * и показывает точную причину ошибки.
 */

const fs   = require("fs");
const path = require("path");
const net  = require("net");
const tls  = require("tls");

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
loadEnv(path.join(__dirname, ".env.local"));
loadEnv(path.join(__dirname, ".env"));

const CFG = {
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE !== "false",
  user:   process.env.SMTP_USER,
  pass:   process.env.SMTP_PASS,
  from:   process.env.EMAIL_FROM || process.env.SMTP_USER,
};

const ok  = s => `\x1b[32m✅  ${s}\x1b[0m`;
const err = s => `\x1b[31m❌  ${s}\x1b[0m`;
const inf = s => `\x1b[36mℹ   ${s}\x1b[0m`;
const wrn = s => `\x1b[33m⚠️   ${s}\x1b[0m`;

// ─── Шаг 1: проверка конфига ──────────────────────────────────────────────────
function checkConfig() {
  console.log("\n── Шаг 1: Конфигурация ──────────────────────────────────");
  let bad = false;
  for (const [k, v] of Object.entries(CFG)) {
    if (!v) { console.log(err(`${k.toUpperCase()} не задан`)); bad = true; }
    else    { console.log(ok(`${k.padEnd(8)}: ${k === "pass" ? "*".repeat(v.length) : v}`)); }
  }
  if (bad) {
    console.log("\n  Добавьте недостающие переменные в .env.local\n");
    process.exit(1);
  }
}

// ─── Шаг 2: TCP-соединение ────────────────────────────────────────────────────
function checkTcp() {
  return new Promise(resolve => {
    console.log(`\n── Шаг 2: TCP-соединение → ${CFG.host}:${CFG.port} ─────────`);
    const s = net.connect(CFG.port, CFG.host);
    s.setTimeout(8000);
    s.on("connect", () => {
      console.log(ok(`TCP-соединение установлено`));
      s.destroy();
      resolve(true);
    });
    s.on("timeout", () => {
      console.log(err(`Таймаут (8с) — порт ${CFG.port} недоступен`));
      console.log(wrn("Проверьте: брандмауэр, антивирус, VPN или смените порт"));
      s.destroy();
      resolve(false);
    });
    s.on("error", e => {
      console.log(err(`TCP ошибка: ${e.message}`));
      s.destroy();
      resolve(false);
    });
  });
}

// ─── Шаг 3: Отправка через nodemailer ────────────────────────────────────────
async function checkSmtp(to) {
  console.log(`\n── Шаг 3: Отправка тестового письма → ${to} ─────────────`);

  let nodemailer;
  try { nodemailer = require("nodemailer"); }
  catch {
    console.log(err("nodemailer не установлен — запустите: npm install"));
    return;
  }

  // Пробуем несколько вариантов конфигурации
  const variants = [
    { label: "SSL  port 465",    port: 465, secure: true,  tls: { rejectUnauthorized: false } },
    { label: "STARTTLS port 587",port: 587, secure: false, tls: { rejectUnauthorized: false } },
    { label: "SSL  port 465 (strict)", port: 465, secure: true },
  ];

  for (const v of variants) {
    process.stdout.write(`  Попытка [${v.label}] ... `);
    const t = nodemailer.createTransport({
      host: CFG.host,
      port: v.port,
      secure: v.secure,
      auth: { user: CFG.user, pass: CFG.pass },
      ...(v.tls ? { tls: v.tls } : {}),
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    try {
      const info = await t.sendMail({
        from:    CFG.from,
        to,
        subject: "WatchLab — тест SMTP",
        text:    `Тест отправки. Если вы получили это письмо — SMTP работает!\n\nКонфиг: ${CFG.host}:${v.port}`,
        html:    `<p>✅ SMTP работает!<br>Конфиг: <code>${CFG.host}:${v.port}</code></p>`,
      });
      console.log(ok(`Отправлено! messageId: ${info.messageId}`));
      console.log(`\n  Рабочая конфигурация для .env.local:`);
      console.log(`  SMTP_PORT=${v.port}`);
      console.log(`  SMTP_SECURE=${v.secure}`);
      if (v.tls) console.log(`  # добавьте tls.rejectUnauthorized: false в notifications.ts`);
      return v;
    } catch (e) {
      console.log(`\n  ${err(diagnose(e))}`);
    }
  }

  console.log(`\n${wrn("Ни один вариант не сработал. Причины:")}`);
  console.log(`  1. Проверьте пароль приложения в настройках Mail.ru`);
  console.log(`  2. Включите SMTP: Настройки почты → Почтовые программы → IMAP/SMTP`);
  console.log(`  3. Возможно, ваш провайдер блокирует исходящий SMTP (попробуйте VPN)`);
}

function diagnose(e) {
  const m = e.message || "";
  if (m.includes("ECONNREFUSED"))  return `Порт закрыт (ECONNREFUSED)`;
  if (m.includes("ETIMEDOUT"))     return `Таймаут соединения (ETIMEDOUT)`;
  if (m.includes("ECONNRESET"))    return `Соединение сброшено (ECONNRESET)`;
  if (m.includes("535") || m.includes("534") || m.includes("Username and Password"))
                                   return `Неверный логин/пароль (535) — проверьте пароль приложения`;
  if (m.includes("550"))           return `Ящик отклонил отправку (550) — проверьте EMAIL_FROM`;
  if (m.includes("certificate"))   return `TLS-сертификат — добавьте rejectUnauthorized:false`;
  if (m.includes("ENOTFOUND"))     return `Хост не найден: ${CFG.host}`;
  return m;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const to = process.argv[2] || CFG.user;
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║    WatchLab — диагностика SMTP           ║");
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(inf(`Письмо будет отправлено на: ${to}`));

  checkConfig();
  const tcpOk = await checkTcp();
  if (tcpOk) await checkSmtp(to);

  console.log("\n────────────────────────────────────────────\n");
}

main().catch(e => { console.error(err(e.message)); process.exit(1); });
