/**
 * Email через nodemailer (SMTP).
 * Поддерживает Mail.ru, Яндекс, Gmail и любой SMTP-сервер.
 *
 * Переменные в .env.local:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */

import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  if (!_transporter) {
    const port   = parseInt(process.env.SMTP_PORT ?? "465", 10);
    const secure = process.env.SMTP_SECURE !== "false"; // true = SSL (465), false = STARTTLS (587)

    _transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        // Mail.ru и ряд российских провайдеров требуют отключения
        // строгой проверки цепочки сертификатов
        rejectUnauthorized: false,
      },
      connectionTimeout: 10_000,
      greetingTimeout:   10_000,
      socketTimeout:     15_000,
    });
  }

  return _transporter;
}

const emailFrom = () =>
  process.env.EMAIL_FROM ||
  process.env.SMTP_USER ||
  "noreply@watchlab.example.com";

// ─── HTML шаблон ─────────────────────────────────────────────────────────────

function codeEmailHtml(code: string) {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;max-width:100%">
        <tr>
          <td style="background:#1a1a2e;padding:24px 32px">
            <span style="color:#b48c42;font-size:1.3rem;font-weight:700;letter-spacing:.05em">
              &#9201; WatchLab
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;color:#333;font-size:1rem">
              Для входа в личный кабинет введите код подтверждения:
            </p>
            <div style="background:#f5f0e8;border-radius:8px;padding:20px;text-align:center;margin:0 0 20px">
              <span style="font-size:2.4rem;font-weight:700;letter-spacing:.25em;color:#b48c42">
                ${code}
              </span>
            </div>
            <p style="margin:0;color:#888;font-size:.85rem;line-height:1.5">
              Код действителен <strong>10 минут</strong>.<br>
              Если вы не запрашивали вход — просто проигнорируйте это письмо.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f0e8;padding:16px 32px">
            <p style="margin:0;color:#aaa;font-size:.75rem">WatchLab — сервисный центр по ремонту часов</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export async function sendEmailCode(email: string, code: string) {
  const transporter = getTransporter();

  if (!transporter) {
    console.info(`[email-code] ${email} → ${code}  (dev: SMTP не настроен)`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from:    emailFrom(),
      to:      email,
      subject: `${code} — ваш код подтверждения WatchLab`,
      html:    codeEmailHtml(code),
      text:    `Ваш код подтверждения WatchLab: ${code}\n\nКод действителен 10 минут.`,
    });
    console.info(`[email-code] отправлено ${email} (${info.messageId})`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[email-code] SMTP ошибка (${email}):`, msg);

    // Понятное сообщение для пользователя
    if (msg.includes("535") || msg.includes("Username and Password")) {
      throw new Error("Неверный логин или пароль SMTP. Проверьте SMTP_USER / SMTP_PASS.");
    }
    if (msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT") || msg.includes("ECONNRESET")) {
      throw new Error("Не удалось подключиться к SMTP-серверу. Проверьте SMTP_HOST / SMTP_PORT.");
    }
    throw new Error("Не удалось отправить письмо. Запустите node test-smtp.js для диагностики.");
  }
}

// ─── SMS (заглушка) ───────────────────────────────────────────────────────────

export async function sendSmsCode(phone: string, code: string) {
  console.info(`[sms-code] ${phone} → ${code}`);
}

// ─── Системные уведомления ────────────────────────────────────────────────────

export async function sendClientNotification(phoneOrEmail: string, message: string) {
  console.info(`[notification][client] ${phoneOrEmail}: ${message}`);
}

export async function sendMasterNotification(masterId: string, message: string) {
  console.info(`[notification][master] ${masterId}: ${message}`);
}
