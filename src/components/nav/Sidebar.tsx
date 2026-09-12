import { Wordmark } from "@/components/brand/Wordmark";
import { NavLinks, type NavItem } from "@/components/nav/NavLinks";
import { Icon } from "@/components/Icon";
import { toggleLocale, logout } from "@/lib/actions";
import { t } from "@/lib/i18n";
import { ROLE_LABEL, type Locale } from "@/lib/domain/constants";
import type { SessionUser } from "@/lib/session";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function Sidebar({ user, locale, items }: { user: SessionUser; locale: Locale; items: NavItem[] }) {
  const isAr = locale === "ar";
  const orgName = isAr && user.org?.nameAr ? user.org.nameAr : user.org?.name;
  const userName = isAr && user.nameAr ? user.nameAr : user.name;

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-primary-deep text-white md:flex">
      <div className="px-5 pb-2 pt-5">
        <Wordmark size={30} tone="mono" />
      </div>

      <div className="mx-4 mb-4 mt-3 rounded-lg bg-white/[0.06] px-3 py-2.5">
        <div className="text-[12px] text-white/55">{ROLE_LABEL[user.role][locale]}</div>
        <div className="mt-0.5 truncate text-sm font-semibold leading-snug">{orgName}</div>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <NavLinks items={items} />
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-1.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/12 text-xs font-bold">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{userName}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <form action={toggleLocale} className="flex-1">
            <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-white/12">
              <Icon name="globe" size={15} />
              {t(locale, "nav.language")}
            </button>
          </form>
          <form action={logout}>
            <button
              aria-label={t(locale, "nav.logout")}
              className="grid place-items-center rounded-lg bg-white/[0.06] px-3 py-2 text-white/85 transition-colors hover:bg-white/12"
            >
              <Icon name="logout" size={15} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
