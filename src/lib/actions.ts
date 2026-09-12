"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ROLE_HOME, type Role, type Locale } from "@/lib/domain/constants";
import { SESSION_COOKIE, LOCALE_COOKIE, getLocale } from "@/lib/session";

export async function loginAs(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) redirect("/");
  const c = await cookies();
  c.set(SESSION_COOKIE, u.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect(ROLE_HOME[u.role as Role] ?? "/");
}

export async function logout() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  redirect("/");
}

export async function setLocale(locale: Locale) {
  const c = await cookies();
  c.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/", "layout");
}

export async function toggleLocale() {
  const current = await getLocale();
  await setLocale(current === "ar" ? "fr" : "ar");
}
