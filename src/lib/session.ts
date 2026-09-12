import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ROLE_HOME, type Role, type Locale } from "@/lib/domain/constants";

export const SESSION_COOKIE = "sulha_session";
export const LOCALE_COOKIE = "sulha_locale";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get(LOCALE_COOKIE)?.value === "ar" ? "ar" : "fr";
}

export type SessionOrg = {
  id: string;
  name: string;
  nameAr: string | null;
  kind: string;
  branding: string | null;
  stateOwned: boolean;
};

export type SessionUser = {
  id: string;
  name: string;
  nameAr: string | null;
  role: Role;
  lang: Locale;
  orgId: string | null;
  org: SessionOrg | null;
};

export async function getSession(): Promise<SessionUser | null> {
  const c = await cookies();
  const id = c.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const u = await prisma.user.findUnique({ where: { id }, include: { org: true } });
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    nameAr: u.nameAr,
    role: u.role as Role,
    lang: (u.lang as Locale) ?? "fr",
    orgId: u.orgId,
    org: u.org
      ? {
          id: u.org.id,
          name: u.org.name,
          nameAr: u.org.nameAr,
          kind: u.org.kind,
          branding: u.org.branding,
          stateOwned: u.org.stateOwned,
        }
      : null,
  };
}

/** Redirect to the picker if not signed in. */
export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/");
  return s;
}

/** Redirect to the picker if not signed in, or to their own home if wrong role. */
export async function requireRole(role: Role): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/");
  if (s.role !== role) redirect(ROLE_HOME[s.role] ?? "/");
  return s;
}
