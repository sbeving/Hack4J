"use client";

import { confirmEvidenceAction, removeEvidenceAction } from "@/lib/domain/claim-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Badge, Field, Input, Textarea } from "@/components/ui";
import type { ClaimType, Locale } from "@/lib/domain/constants";
import { intakeFor } from "@/lib/domain/claim-intake";

type Extraction = {
  documentKind?: string;
  summary?: string;
  amountTnd?: number | null;
  reference?: string | null;
  providerName?: string | null;
  documentDate?: string | null;
  fields?: { label: string; value: string; uncertainty?: string }[];
  source?: "ai" | "fallback";
};

function needsManualEntry(ex: Extraction): boolean {
  if (ex.source === "fallback") return true;
  return (
    ex.amountTnd == null &&
    !ex.reference &&
    !ex.providerName &&
    !ex.documentDate &&
    (!ex.fields || ex.fields.length === 0)
  );
}

export function EvidenceReviewCard({
  caseId,
  evidenceId,
  extraction,
  claimType,
  locale,
}: {
  caseId: string;
  evidenceId: string;
  extraction: Extraction;
  claimType: ClaimType;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const manual = needsManualEntry(extraction);
  const intake = intakeFor(claimType, locale);

  const L = {
    title: isAr ? "استخراج بالذكاء الاصطناعي" : "Extraction IA",
    unavailable: isAr ? "غير متاح" : "indisponible",
    manualHint: isAr
      ? "أكمل الحقول يدوياً ثم أكّد، أو احذف الملف لرفع مستند آخر."
      : "Complétez les champs manuellement puis confirmez, ou supprimez le fichier pour en téléverser un autre.",
    reviewHint: isAr
      ? "تحقق من البيانات المستخرجة وعدّلها إن لزم قبل التأكيد."
      : "Vérifiez les données extraites et corrigez-les si besoin avant de confirmer.",
    summary: isAr ? "ملخص المستند" : "Résumé du document",
    amount: intake.amountLabel[locale],
    reference: intake.referenceLabel[locale],
    provider: isAr ? "المزوّد / الجهة" : "Fournisseur / émetteur",
    date: isAr ? "تاريخ المستند" : "Date du document",
    confirm: isAr ? "تأكيد" : "Confirmer",
    confirming: isAr ? "جارٍ التأكيد…" : "Confirmation…",
    discard: isAr ? "حذف الملف" : "Supprimer le fichier",
    discarding: isAr ? "جارٍ الحذف…" : "Suppression…",
  };

  return (
    <div className="mt-3 rounded-lg bg-surface-sand p-4 text-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-primary">{L.title}</span>
        {extraction.source === "fallback" ? (
          <Badge tone="warning">{L.unavailable}</Badge>
        ) : null}
      </div>

      <p className="mb-4 text-xs text-ink-muted">{manual ? L.manualHint : L.reviewHint}</p>

      <form action={confirmEvidenceAction.bind(null, caseId, evidenceId)} className="space-y-4">
        <Field label={L.summary}>
          <Textarea
            name="summary"
            rows={2}
            dir="auto"
            defaultValue={extraction.summary ?? ""}
            placeholder={intake.narrativePlaceholder[locale]}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L.amount}>
            <Input
              name="amountTnd"
              type="number"
              step="0.001"
              min="0"
              defaultValue={extraction.amountTnd ?? ""}
              placeholder={intake.amountPlaceholder[locale]}
            />
          </Field>
          <Field label={L.reference}>
            <Input
              name="reference"
              type="text"
              dir="auto"
              defaultValue={extraction.reference ?? ""}
              placeholder={intake.referencePlaceholder[locale]}
            />
          </Field>
          <Field label={L.provider}>
            <Input
              name="providerName"
              type="text"
              dir="auto"
              defaultValue={extraction.providerName ?? ""}
              placeholder="STEG"
            />
          </Field>
          <Field label={L.date}>
            <Input
              name="documentDate"
              type="text"
              dir="auto"
              defaultValue={extraction.documentDate ?? ""}
              placeholder={isAr ? "2025-03-15" : "15/03/2025"}
            />
          </Field>
        </div>

        {extraction.fields && extraction.fields.length > 0 ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-border bg-surface p-3 text-xs">
            {extraction.fields.slice(0, 6).map((f, i) => (
              <div key={i} className="flex justify-between gap-2">
                <dt className="text-ink-muted">{f.label}</dt>
                <dd className="text-end font-medium" dir="auto">
                  {f.value}
                  {f.uncertainty === "needs_review" ? (
                    <span className="ms-1 text-warning" title={isAr ? "يحتاج مراجعة" : "à vérifier"}>
                      *
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <SubmitButton pendingLabel={L.confirming}>{L.confirm}</SubmitButton>
        </div>
      </form>

      <form
        action={removeEvidenceAction.bind(null, caseId, evidenceId)}
        className="mt-2 flex justify-end"
      >
        <SubmitButton
          variant="outline"
          className="border-danger/40 text-danger hover:bg-danger-tint"
          pendingLabel={L.discarding}
        >
          {L.discard}
        </SubmitButton>
      </form>
    </div>
  );
}
