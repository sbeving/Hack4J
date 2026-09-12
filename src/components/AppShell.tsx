import Link from "next/link";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/session";
import { ROLE_LABEL, ROLE_HOME, type Locale } from "@/lib/domain/constants";
import { t } from "@/lib/i18n";
import { toggleLocale, logout } from "@/lib/actions";
import { DemoBadge } from "@/components/ui";

export function AppShell({
  user,
  locale,
  children,
}: {
  user: SessionUser;
  locale: Locale;
  children: ReactNode;
}) {
  const orgName = locale === "ar" && user.org?.nameAr ? user.org.nameAr : user.org?.name;
  const userName = locale === "ar" && user.nameAr ? user.nameAr : user.name;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={ROLE_HOME[user.role]} className="flex items-center gap-2">
              <span className="text-xl font-black text-brand">صلح</span>
              <span className="text-lg font-bold tracking-tight">Sulha</span>
            </Link>
            <DemoBadge label={t(locale, "demo.badge")} />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="hidden text-end sm:block">
              <div className="font-semibold leading-tight">{userName}</div>
              <div className="text-xs text-muted">
                {ROLE_LABEL[user.role][locale]} · {orgName}
              </div>
            </div>
            <form action={toggleLocale}>
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                {t(locale, "nav.language")}
              </button>
            </form>
            <form action={logout}>
              <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                {t(locale, "nav.logout")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted">
        Sulha · Hack4Justice 2026 · <span className="text-amber-700 font-medium">Données de démonstration</span>
      </footer>
    </div>
  );
}
