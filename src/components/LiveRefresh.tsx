"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// If the stream dies silently (sleep, proxy, dev restart) this catches up.
const SAFETY_POLL_MS = 20000;

/**
 * Keeps a server-rendered screen in sync without a manual reload: subscribe to
 * the pulse stream and `router.refresh()` whenever the signature changes, so the
 * render only runs on real updates.
 *
 * Pass `caseId` for a case detail screen; omit it for a list screen.
 */
export function LiveRefresh({ caseId }: { caseId?: string }) {
  const router = useRouter();
  const seen = useRef<string | null>(null);

  useEffect(() => {
    const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
    let stopped = false;

    // First pulse of a connection is the current state, not a change.
    const apply = (pulse: string) => {
      if (stopped || !pulse) return;
      if (seen.current === null) {
        seen.current = pulse;
      } else if (seen.current !== pulse) {
        seen.current = pulse;
        router.refresh();
      }
    };

    const source = new EventSource(`/api/pulse/stream${query}`);
    source.onmessage = (e) => apply(e.data);

    const poll = async () => {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        const res = await fetch(`/api/pulse${query}`, { cache: "no-store" });
        if (!res.ok) return;
        const { pulse } = (await res.json()) as { pulse?: string };
        if (pulse) apply(pulse);
      } catch {
        // Offline or navigating away.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };

    const safety = setInterval(() => void poll(), SAFETY_POLL_MS);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      source.close();
      clearInterval(safety);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [caseId, router]);

  return null;
}
