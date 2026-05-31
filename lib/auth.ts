import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "dumpyard_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function normalizeSecret(value: string) {
  const trimmed = value.trim();
  const first = trimmed.at(0);
  const last = trimmed.at(-1);

  if (
    trimmed.length >= 2 &&
    ((first === '"' && last === '"') || (first === "'" && last === "'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }
  return normalizeSecret(secret);
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) {
    return false;
  }

  const [expires, signature] = session.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) {
    return false;
  }

  return safeEqual(signature, sign(expires));
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Admin access required.");
  }
}

export function verifyPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  return safeEqual(normalizeSecret(password), normalizeSecret(expected));
}

export async function createAdminSession() {
  const expires = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
