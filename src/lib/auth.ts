import { cookies } from "next/headers";
import crypto from "crypto";
import { verifyStoredPassword } from "./storage";

const AUTH_COOKIE = "str_admin_session";
const SECRET = process.env.AUTH_SECRET || "str-default-secret";

function hashToken(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function verifyPassword(password: string): boolean {
  return verifyStoredPassword(password);
}

export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString("hex");
  const raw = `${timestamp}-${random}`;
  return `${raw}.${hashToken(raw)}`;
}

export function validateSessionToken(token: string): boolean {
  if (!token || !token.includes(".")) return false;
  const [raw, hash] = token.split(".");
  return hashToken(raw) === hash;
}

export function getSessionFromCookies(): boolean {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get(AUTH_COOKIE);
    if (!session?.value) return false;
    return validateSessionToken(session.value);
  } catch {
    return false;
  }
}

export function isAuthenticated(): boolean {
  return getSessionFromCookies();
}

export { AUTH_COOKIE };
