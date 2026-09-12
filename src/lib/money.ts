import type { Locale } from "@/lib/domain/constants";

// Amounts are stored as integer millimes. 1 TND = 1000 millimes.
export function tndToMillimes(tnd: number): number {
  return Math.round(tnd * 1000);
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
