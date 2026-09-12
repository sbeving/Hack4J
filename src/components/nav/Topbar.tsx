import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { NavLinks, type NavItem } from "@/components/nav/NavLinks";
import { Icon } from "@/components/Icon";
import { DemoBadge } from "@/components/ui";
import { toggleLocale, logout } from "@/lib/actions";
import { t } from "@/lib/i18n";
import { ROLE_HOME, ROLE_LABEL, type Locale } from "@/lib/domain/constants";
import type { SessionUser } from "@/lib/session";

export function Topbar({
  user,
  locale,
  unread,
  variant,
  items,
}: {
  user: SessionUser;
  locale: Locale;
  unread: number;
  variant: "console" | "claimant";
  items?: NavItem[];
}) {
  const isAr = locale === "ar";
  const userName = isAr && user.nameAr ? user.nameAr : user.name;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/85 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-5">
        {variant === "claimant" ? (
          <>
            <Link href="/claimant" aria-label="Sulha">
              <Wordmark size={28} />
            </Link>
            {items ? <NavLinks items={items} variant="topbar" /> : null}
          </>
        ) : (
          <Link href={ROLE_HOME[user.role]} className="md:hidden" aria-label="Sulha">
            <Wordmark size={26} />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DemoBadge />
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-sand hover:text-ink"
        >
          <Icon name="bell" size={19} />
          {unread > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-seal px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </Link>

        {variant === "claimant" ? (
          <>
            <form action={toggleLocale}>
              <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-sand">
                <Icon name="globe" size={15} />
                <span className="hidden sm:inline">{t(locale, "nav.language")}</span>
              </button>
            </form>
            <div className="hidden text-end sm:block">
              <div className="text-sm font-semibold leading-tight">{userName}</div>
              <div className="text-xs text-ink-muted">{ROLE_LABEL[user.role][locale]}</div>
            </div>
            <form action={logout}>
              <button
                aria-label={t(locale, "nav.logout")}
                className="grid place-items-center rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-sand hover:text-ink"
              >
                <Icon name="logout" size={17} />
              </button>
            </form>
          </>
        ) : null}
      </div>
    </header>
  );
}
