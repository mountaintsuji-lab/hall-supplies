import { cookies } from "next/headers";

export const SESSION_COOKIE = "pochitto-session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type UserRole = "field" | "admin";

export function isAuthEnabled(): boolean {
  return Boolean(process.env.AUTH_PASSWORD?.trim());
}

export function verifyPassword(password: string): UserRole | null {
  const fieldPw = process.env.AUTH_PASSWORD?.trim();
  const adminPw = process.env.ADMIN_PASSWORD?.trim() ?? fieldPw;

  if (adminPw && password === adminPw) return "admin";
  if (fieldPw && password === fieldPw) return "field";
  return null;
}

function getSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (isAuthEnabled()) return process.env.AUTH_PASSWORD!.trim();
  return null;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Buffer.from(sig).toString("base64url");
}

async function hmacVerify(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expected = await hmacSign(payload, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(role: UserRole): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = `${role}:${exp}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export async function parseSessionToken(
  token: string,
): Promise<{ role: UserRole } | null> {
  const secret = getSecret();
  if (!secret) return null;

  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!(await hmacVerify(payload, sig, secret))) return null;

  const [role, expStr] = payload.split(":");
  if (role !== "field" && role !== "admin") return null;

  const exp = Number.parseInt(expStr ?? "", 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;

  return { role };
}

export async function getSession(): Promise<{ role: UserRole } | null> {
  if (!isAuthEnabled()) return { role: "admin" };

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export async function requireSession(
  minRole: UserRole = "field",
): Promise<{ role: UserRole } | { error: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }
  if (minRole === "admin" && session.role !== "admin") {
    return { error: "管理権限が必要です" };
  }
  return session;
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}
