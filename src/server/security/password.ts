import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("base64url");
  return `scrypt$${salt}$${hash}`;
};

export const verifyPassword = (password: string, storedHash?: string, plainFallback?: string) => {
  if (storedHash?.startsWith("scrypt$")) {
    const [, salt, expectedHash] = storedHash.split("$");
    if (!salt || !expectedHash) {
      return false;
    }

    const actual = Buffer.from(scryptSync(password, salt, KEY_LENGTH).toString("base64url"));
    const expected = Buffer.from(expectedHash);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  return Boolean(plainFallback && plainFallback === password);
};
