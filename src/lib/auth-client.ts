import { AuthSession, UserRole } from "@/types";

const SESSION_KEY = "watch-repair-session";

interface ApiEnvelope<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

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

export const saveSession = (session: AuthSession | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const logout = () => saveSession(null);

export const getAuthHeader = () => {
  const token = getSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function authRequest<T>(path: string, body?: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body ?? {})
  });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Ошибка авторизации");
  }
  if (payload.data === undefined) {
    throw new Error("Сервер вернул пустой ответ");
  }

  return payload.data;
}

export async function requestPhoneCode(phone: string) {
  return authRequest<{ success: boolean; debugCode?: string }>("/api/auth/request-code", { phone });
}

export async function loginWithPhone(phone: string, code: string) {
  const session = await authRequest<AuthSession>("/api/auth/login-phone", { phone, code });
  saveSession(session);
  return session;
}

export async function loginWithEmail(email: string, password: string) {
  const session = await authRequest<AuthSession>("/api/auth/login-email", { email, password });
  saveSession(session);
  return session;
}

export async function switchDemoRole(role: UserRole) {
  const session = await authRequest<AuthSession>("/api/auth/demo-role", { role });
  saveSession(session);
  return session;
}
