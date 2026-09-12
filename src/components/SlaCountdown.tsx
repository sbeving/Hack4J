"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/domain/constants";

export function SlaCountdown({
  dueAtISO,
  serverNowISO,
  locale,
}: {
  dueAtISO: string;
  serverNowISO: string;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const due = new Date(dueAtISO).getTime();
  // Anchor to server time to avoid client-clock skew.
  const skew = Date.now() - new Date(serverNowISO).getTime();
  const [now, setNow] = useState<number>(() => Date.now() - skew);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() - skew), 1000);
    return () => clearInterval(id);
  }, [skew]);

  const remaining = due - now;
  const overdue = remaining <= 0;
  const abs = Math.abs(remaining);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
        overdue ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${overdue ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`} />
      {overdue
        ? isAr
          ? `تجاوز الأجل +${clock}`
          : `SLA dépassé +${clock}`
        : isAr
          ? `يتبقّى ${clock}`
          : `SLA : ${clock} restant`}
    </div>
  );
}
