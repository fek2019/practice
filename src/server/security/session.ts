import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { AuthSession, User, UserRole } from "@/types";
import { getSessionMaxAgeSeconds, getSessionSecret } from "../config";
import { forbidden, unauthorized } from "../errors";

interface SessionPayload {
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  linkedMasterId?: string;
  exp: number;
}

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (payload: string) =>
  createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");

const toSession = (payload: SessionPayload, token: string): AuthSession => ({
  userId: payload.userId,
  name: payload.name,
  phone: payload.phone,
  email: payload.email,
  role: payload.role,
  linkedMasterId: payload.linkedMasterId,
  token,
  expiresAt: new Date(payload.exp * 1000).toISOString()
});

export const issueSession = (user: User): AuthSession => {
  const exp = Math.floor(Date.now() / 1000) + getSessionMaxAgeSeconds();
  const payload: SessionPayload = {
    userId: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    linkedMasterId: user.linkedMasterId,
    exp
  };
  const encodedPayload = encode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return toSession(payload, `${encodedPayload}.${signature}`);
};

export const verifySessionToken = (token?: string | null): AuthSession | null => {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(encodedPayload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(encodedPayload)) as SessionPayload;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return toSession(payload, token);
  } catch {
    return null;
  }
};

export const getRequestSession = (request: NextRequest) => {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  return verifySessionToken(token);
};

export const requireSession = (request: NextRequest, roles?: UserRole[]) => {
  const session = getRequestSession(request);
  if (!session) {
    throw unauthorized();
  }

  if (roles && !roles.includes(session.role)) {
    throw forbidden();
  }

  return session;
};
