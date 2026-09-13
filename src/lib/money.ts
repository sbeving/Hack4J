import type { Locale } from "@/lib/domain/constants";

// Amounts are stored as integer millimes. 1 TND = 1000 millimes.
// Prisma maps to SQLite INT — stay within signed 32-bit range.
export const MAX_MILLIMES = 2_147_483_647;

export function clampMillimes(m: number): number {
  if (!Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(MAX_MILLIMES, Math.floor(m)));
}

export function tndToMillimes(tnd: number): number {
  return clampMillimes(Math.round(tnd * 1000));
}

export function millimesToTnd(m: number): number {
  return m / 1000;
}

// TND is written with 3 decimals (e.g. 900.000 TND / 900.000 د.ت).
export function formatMillimes(m: number, locale: Locale = "fr"): string {
  const tnd = m / 1000;
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-TN" : "fr-TN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  const symbol = locale === "ar" ? "د.ت" : "TND";
  return `${nf.format(tnd)} ${symbol}`;
}
