import { AuthSession, User, UserRole } from "@/types";
import { mockDb } from "./data";

const SESSION_KEY = "watch-repair-session";
export const DEMO_SMS_CODE = "1234";

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9000)}`;

const toSession = (user: User): AuthSession => ({
  userId: user.id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
  linkedMasterId: user.linkedMasterId
});

const saveSession = (session: AuthSession | null) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const logout = () => {
  saveSession(null);
};

/**
 * BACKEND STUB LOCATION:
 * - File: src/lib/stubs/auth.ts
 * - Function: requestPhoneCode
 * Replace with Firebase Auth (phone verification) or SMS provider.
 */
export async function requestPhoneCode(phone: string) {
  await wait();
  if (!phone.trim()) {
    throw new Error("Введите номер телефона");
  }
  return {
    success: true,
    debugCode: DEMO_SMS_CODE
  };
}

const ensureClientByPhone = (phone: string) => {
  let user = mockDb.users.find((candidate) => candidate.phone === phone);
  if (!user) {
    user = {
      id: generateId("u"),
      name: "Новый клиент",
      phone,
      email: "",
      role: "client",
      appointments: []
    };
    mockDb.users.push(user);
  }
  return user;
};

export async function loginWithPhone(phone: string, code: string): Promise<AuthSession> {
  await wait();
  if (code !== DEMO_SMS_CODE) {
    throw new Error("Неверный код подтверждения");
  }

  const user = ensureClientByPhone(phone);
  const session = toSession(user);
  saveSession(session);
  return session;
}

/**
 * BACKEND STUB LOCATION:
 * - File: src/lib/stubs/auth.ts
 * - Function: loginWithEmail
 * Replace with Firebase Auth / Supabase Auth real login.
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthSession> {
  await wait();
  if (!email.trim() || !password.trim()) {
    throw new Error("Email и пароль обязательны");
  }

  let user = mockDb.users.find((candidate) => candidate.email === email);
  if (!user) {
    user = {
      id: generateId("u"),
      name: "Новый клиент",
      phone: "",
      email,
      role: "client",
      password,
      appointments: []
    };
    mockDb.users.push(user);
  }

  if (user.password && user.password !== password) {
    throw new Error("Неверный пароль");
  }

  const session = toSession(user);
  saveSession(session);
  return session;
}

export async function switchDemoRole(role: UserRole): Promise<AuthSession> {
  await wait();
  const template = mockDb.users.find((user) => user.role === role);
  if (!template) {
    throw new Error("Роль не найдена");
  }
  const session = toSession(template);
  saveSession(session);
  return session;
}

