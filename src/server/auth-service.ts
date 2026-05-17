import { AuthSession, UserRole } from "@/types";
import { isDemoAuthEnabled } from "./config";
import { badRequest, forbidden, unauthorized } from "./errors";
import { sendEmailCode, sendSmsCode } from "./notifications";
import { getRepository } from "./repositories";
import { hashPassword, verifyPassword } from "./security/password";
import { issueSession } from "./security/session";

export const DEMO_SMS_CODE = "1234";
export const DEMO_EMAIL_CODE = "2468";
const codeStore = new Map<string, { code: string; expiresAt: number }>();
const emailCodeStore = new Map<string, { code: string; expiresAt: number }>();

const normalize = (value: string) => value.trim().toLowerCase();

const generateCode = () =>
  process.env.NODE_ENV === "production"
    ? Math.floor(1000 + Math.random() * 9000).toString()
    : DEMO_SMS_CODE;

export async function requestPhoneCode(phone: string) {
  if (!phone.trim()) {
    throw badRequest("Введите номер телефона");
  }

  const code = generateCode();
  codeStore.set(phone.trim(), {
    code,
    expiresAt: Date.now() + 1000 * 60 * 10
  });

  await sendSmsCode(phone.trim(), code);

  return {
    success: true,
    debugCode: process.env.NODE_ENV === "production" ? undefined : code
  };
}

export async function requestEmailCode(email: string) {
  const normalizedEmail = normalize(email);
  if (!normalizedEmail) {
    throw badRequest("Введите email");
  }

  const code = process.env.NODE_ENV === "production"
    ? Math.floor(1000 + Math.random() * 9000).toString()
    : DEMO_EMAIL_CODE;

  emailCodeStore.set(normalizedEmail, {
    code,
    expiresAt: Date.now() + 1000 * 60 * 10
  });

  await sendEmailCode(normalizedEmail, code);

  return {
    success: true,
    debugCode: process.env.NODE_ENV === "production" ? undefined : code
  };
}

export async function loginWithPhone(phone: string, code: string): Promise<AuthSession> {
  const normalizedPhone = phone.trim();
  const stored = codeStore.get(normalizedPhone);
  const demoAllowed = isDemoAuthEnabled() && code === DEMO_SMS_CODE;

  if ((!stored || stored.expiresAt < Date.now() || stored.code !== code) && !demoAllowed) {
    throw unauthorized("Неверный код подтверждения");
  }

  codeStore.delete(normalizedPhone);

  const repository = getRepository();
  const user = (await repository.getUserByPhone(normalizedPhone)) ??
    (await repository.createClientUser({
      name: "Новый клиент",
      phone: normalizedPhone
    }));

  if (user.isBanned) {
    throw forbidden("Аккаунт заблокирован");
  }

  return issueSession(user);
}

export async function loginWithEmail(email: string, password: string, code: string): Promise<AuthSession> {
  if (!email.trim() || !password.trim() || !code.trim()) {
    throw badRequest("Email, пароль и код обязательны");
  }

  const repository = getRepository();
  const normalizedEmail = normalize(email);
  const stored = emailCodeStore.get(normalizedEmail);
  const demoAllowed = isDemoAuthEnabled() && code === DEMO_EMAIL_CODE;

  if ((!stored || stored.expiresAt < Date.now() || stored.code !== code) && !demoAllowed) {
    throw unauthorized("Неверный код подтверждения email");
  }

  emailCodeStore.delete(normalizedEmail);
  const user = await repository.getUserByEmail(normalizedEmail);

  if (!user) {
    const created = await repository.createClientUser({
      name: "Новый клиент",
      email: normalizedEmail,
      passwordHash: hashPassword(password)
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
