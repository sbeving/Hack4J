import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { NavLinks, type NavItem } from "@/components/nav/NavLinks";
import { Icon } from "@/components/Icon";
import { DemoBadge } from "@/components/ui";
import { ROLE_HOME, type Locale } from "@/lib/domain/constants";
import type { SessionUser } from "@/lib/session";

export function Topbar({
  user,
  locale,
  unread,
  items,
}: {
  user: SessionUser;
  locale: Locale;
  unread: number;
  items: NavItem[];
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/85 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Link href={ROLE_HOME[user.role]} className="md:hidden" aria-label="Sulha">
          <Wordmark size={26} />
        </Link>
        <div className="md:hidden">
          <NavLinks items={items} variant="topbar" />
        </div>
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
      </div>
    </header>
  );
}
