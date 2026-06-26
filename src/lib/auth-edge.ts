/** Edge / middleware 用（cookies() 非依存） */

export const SESSION_COOKIE = "pochitto-session";

export type UserRole = "field" | "admin";

export function isAuthEnabled(): boolean {
  return Boolean(process.env.AUTH_PASSWORD?.trim());
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
  const bytes = new Uint8Array(sig);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
