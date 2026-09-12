"use client";

import { useState } from "react";
import { escalateAction } from "@/lib/domain/escalation-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/domain/constants";

export function EscalationPanel({
  caseId,
  reason,
  locale,
}: {
  caseId: string;
  reason: string;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const [consent, setConsent] = useState(false);

  return (
    <Card className="border-border bg-cobalt-tint p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink font-display">
        <Icon name="scales" className="text-cobalt" />
        {isAr ? "التصعيد إلى الوسيط المحايد" : "Escalade vers le médiateur neutre"}
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        {isAr ? "سبب مؤهِّل: " : "Motif éligible : "}
        <b className="text-ink">{reason}</b>
      </p>
      <form action={escalateAction.bind(null, caseId)} className="mt-3 space-y-3">
        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            {isAr
              ? "أوافق على مشاركة ملفّي (الأدلة والإنذار والتبادلات) مع المؤسسة المحايدة."
              : "Je consens au partage de mon dossier (preuves, mise en demeure, échanges) avec l'institution neutre."}
          </span>
        </label>
        <SubmitButton
          disabled={!consent}
          pendingLabel={isAr ? "جارٍ تكوين الملفّ…" : "Constitution du dossier…"}
        >
          {isAr ? "تصعيد (تكوين الملفّ)" : "Escalader (constituer le dossier)"}
        </SubmitButton>
      </form>
    </Card>
  );
}
