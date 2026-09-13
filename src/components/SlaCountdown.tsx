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
  const serverNow = new Date(serverNowISO).getTime();
  const [now, setNow] = useState<number>(serverNow);

  useEffect(() => {
    // Anchor to server time to avoid client-clock skew (read the clock in the effect, not render).
    const skew = Date.now() - serverNow;
    const tick = () => setNow(Date.now() - skew);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [serverNow]);

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
        overdue ? "bg-danger-tint text-seal" : "bg-success-tint text-success"
      }`}
    >
      <span className={`dot ${overdue ? "bg-seal" : "bg-success animate-pulse"}`} />
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
