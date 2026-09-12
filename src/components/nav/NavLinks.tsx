"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Icon, type IconName } from "@/components/Icon";

export type NavItem = { href: string; label: string; icon: IconName };

export function NavLinks({ items, variant = "rail" }: { items: NavItem[]; variant?: "rail" | "topbar" }) {
  const path = usePathname();
  const best = items.reduce<NavItem | null>((b, it) => {
    const match = path === it.href || path.startsWith(it.href + "/");
    return match && it.href.length > (b?.href.length ?? 0) ? it : b;
  }, null);

  if (variant === "topbar") {
    return (
      <nav className="flex items-center gap-1">
        {items.map((it) => {
          const active = it === best;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-primary-tint text-primary-deep" : "text-ink-muted hover:bg-surface-sand hover:text-ink"
              )}
            >
              <Icon name={it.icon} size={17} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {items.map((it) => {
        const active = it === best;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={clsx(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-white/[0.12] text-white shadow-[inset_2px_0_0_var(--gold)]"
                : "text-white/65 hover:bg-white/[0.07] hover:text-white"
            )}
          >
            <Icon name={it.icon} size={19} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
