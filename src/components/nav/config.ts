import type { Role, Locale } from "@/lib/domain/constants";
import type { IconName } from "@/components/Icon";

type NavConfigItem = { href: string; label: Record<Locale, string>; icon: IconName };

export const NAV: Record<Role, NavConfigItem[]> = {
  claimant: [
    { href: "/claimant", label: { fr: "Mes réclamations", ar: "مطالبي" }, icon: "document" },
    { href: "/claimant/new", label: { fr: "Nouvelle", ar: "مطلب جديد" }, icon: "plus" },
  ],
  provider_agent: [
    { href: "/provider", label: { fr: "Réclamations reçues", ar: "المطالب الواردة" }, icon: "stamp" },
  ],
  resolver: [
    { href: "/institution", label: { fr: "Dossiers escaladés", ar: "الملفّات المصعّدة" }, icon: "scales" },
  ],
  admin: [{ href: "/admin", label: { fr: "Supervision", ar: "الإشراف" }, icon: "network" }],
};

export const CONSOLE_ROLES: Role[] = ["provider_agent", "resolver", "admin"];

export function navFor(role: Role, locale: Locale) {
  return NAV[role].map((it) => ({ href: it.href, label: it.label[locale], icon: it.icon }));
}
