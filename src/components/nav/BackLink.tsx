import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/domain/constants";

export function BackLink({
  href,
  locale,
  label,
  className,
}: {
  href: string;
  locale: Locale;
  label?: string;
  className?: string;
}) {
  const isAr = locale === "ar";
  const text = label ?? (isAr ? "رجوع" : "Retour");

  return (
    <Link
      href={href}
      className={`mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-primary ${className ?? ""}`}
    >
      <Icon name="chevron" size={16} className={isAr ? "" : "rotate-180"} />
      {text}
    </Link>
  );
}
