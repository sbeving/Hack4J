import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/session";
import { getUnreadCount } from "@/lib/domain/notifications";
import { navFor } from "@/components/nav/config";
import { Sidebar } from "@/components/nav/Sidebar";
import { Topbar } from "@/components/nav/Topbar";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/domain/constants";

export async function AppShell({
  user,
  locale,
  children,
}: {
  user: SessionUser;
  locale: Locale;
  children: ReactNode;
}) {
  const unread = await getUnreadCount(user.id);
  const items = navFor(user.role, locale);
  const isAr = locale === "ar";

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar user={user} locale={locale} items={items} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} locale={locale} unread={unread} items={items} />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>

        <footer className="border-t border-border bg-surface/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 text-xs text-ink-muted md:px-8">
            <span>Sulha · Hack4Justice 2026</span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="shield" size={14} className="text-primary" />
              {isAr ? "السجل موثّق · بيانات عرض" : "Registre vérifié · données de démonstration"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
