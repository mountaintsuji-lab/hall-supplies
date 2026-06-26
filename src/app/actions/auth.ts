"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createSessionToken,
  isAuthEnabled,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(
  password: string,
  redirectTo?: string,
): Promise<LoginResult> {
  if (!isAuthEnabled()) {
    return { ok: false, error: "認証が有効化されていません" };
  }

  const role = verifyPassword(password);
  if (!role) {
    return { ok: false, error: "パスワードが正しくありません" };
  }

  const token = await createSessionToken(role);
  if (!token) {
    return { ok: false, error: "セッションを作成できませんでした" };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions(token));

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
