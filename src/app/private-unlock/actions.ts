"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PRIVATE_UNLOCK_COOKIE = "private_unlocked";
const PRIVATE_PASSWORD = "password";

export async function unlockPrivate(formData: FormData): Promise<{ error?: string } | void> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/private");

  if (password !== PRIVATE_PASSWORD) {
    return { error: "Wrong password" };
  }

  (await cookies()).set(PRIVATE_UNLOCK_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  redirect(next.startsWith("/") ? next : "/private");
}
