import { AuthSession, UserRole } from "@/types";
import { storeCode, verifyCode } from "./auth-codes";
import { isDemoAuthEnabled } from "./config";
import { badRequest, forbidden, unauthorized } from "./errors";
import { sendEmailCode, sendSmsCode } from "./notifications";
import { getRepository } from "./repositories";
import { hashPassword, verifyPassword } from "./security/password";
import { issueSession } from "./security/session";
import { validateEmail, validatePhone } from "./validation";

export const DEMO_SMS_CODE = "1234";
export const DEMO_EMAIL_CODE = "2468";

const generateCode = () =>
  process.env.NODE_ENV === "production"
    ? Math.floor(1000 + Math.random() * 9000).toString()
    : DEMO_SMS_CODE;

const generateEmailCode = () =>
  process.env.NODE_ENV === "production"
    ? Math.floor(1000 + Math.random() * 9000).toString()
    : DEMO_EMAIL_CODE;

// ─── Request code ─────────────────────────────────────────────────────────────

export async function requestPhoneCode(phone: string) {
  const normalizedPhone = validatePhone(phone);
  const code = generateCode();

  await storeCode(`phone:${normalizedPhone}`, code);
  await sendSmsCode(normalizedPhone, code);

  return {
    success: true,
    debugCode: process.env.NODE_ENV === "production" ? undefined : code,
  };
}

export async function requestEmailCode(email: string) {
  const normalizedEmail = validateEmail(email);
  const code = generateEmailCode();

  await storeCode(`email:${normalizedEmail}`, code);
  await sendEmailCode(normalizedEmail, code);

  return {
    success: true,
    debugCode: process.env.NODE_ENV === "production" ? undefined : code,
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginWithPhone(
  phone: string,
  code: string
): Promise<AuthSession> {
  const normalizedPhone = validatePhone(phone);

  const demoAllowed = isDemoAuthEnabled() && code === DEMO_SMS_CODE;
  const codeValid = demoAllowed || (await verifyCode(`phone:${normalizedPhone}`, code));

  if (!codeValid) {
    throw unauthorized("Неверный или просроченный код подтверждения");
  }

  const repository = getRepository();
  const user =
    (await repository.getUserByPhone(normalizedPhone)) ??
    (await repository.createClientUser({
      name: "Новый клиент",
      phone: normalizedPhone,
    }));

  if (user.isBanned) {
    throw forbidden("Аккаунт заблокирован");
  }

  return issueSession(user);
}

export async function loginWithEmail(
  email: string,
  password: string,
  code: string
): Promise<AuthSession> {
  if (!password.trim() || !code.trim()) {
    throw badRequest("Email, пароль и код обязательны");
  }

  const normalizedEmail = validateEmail(email);

  const demoAllowed = isDemoAuthEnabled() && code === DEMO_EMAIL_CODE;
  const codeValid =
    demoAllowed || (await verifyCode(`email:${normalizedEmail}`, code));

  if (!codeValid) {
    throw unauthorized("Неверный или просроченный код подтверждения");
  }

  const repository = getRepository();
  const user = await repository.getUserByEmail(normalizedEmail);

  if (!user) {
    const created = await repository.createClientUser({
      name: "Новый клиент",
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    });
    return issueSession(created);
  }

  if (user.isBanned) {
    throw forbidden("Аккаунт заблокирован");
  }

  if (!verifyPassword(password, user.passwordHash, user.password)) {
    throw unauthorized("Неверный пароль");
  }

  return issueSession(user);
}

// ─── Demo role switch ─────────────────────────────────────────────────────────

export async function switchDemoRole(role: UserRole): Promise<AuthSession> {
  if (!isDemoAuthEnabled()) {
    throw forbidden("Демо-вход отключен");
  }

  const user = await getRepository().getFirstUserByRole(role);
  if (!user) {
    throw badRequest("Роль не найдена");
  }

  return issueSession(user);
}
