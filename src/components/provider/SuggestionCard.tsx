import { Suspense } from "react";
import { getOrCreateSuggestion } from "@/lib/domain/provider";
import { Card, Badge } from "@/components/ui";
import { REMEDY_LABEL, type Locale, type RequestedRemedy } from "@/lib/domain/constants";

/**
 * Provider-side resolution suggestion. Generated on first view of a case, so it
 * is streamed in its own boundary rather than delaying the case page.
 */
export function SuggestionCard({
  caseId,
  orgId,
  locale,
}: {
  caseId: string;
  orgId: string;
  locale: Locale;
}) {
  return (
    <Suspense fallback={<SuggestionPending locale={locale} />}>
      <Suggestion caseId={caseId} orgId={orgId} locale={locale} />
    </Suspense>
  );
}

async function Suggestion({
  caseId,
  orgId,
  locale,
}: {
  caseId: string;
  orgId: string;
  locale: Locale;
}) {
  const suggestion = await getOrCreateSuggestion(caseId, orgId);
  if (!suggestion) return null;
  const isAr = locale === "ar";

  return (
    <Card className="border-border bg-primary-tint p-5">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[15px] font-semibold text-primary-deep">
          {isAr ? "مساعدة الذكاء الاصطناعي" : "Assistance IA"}
        </h3>
        {suggestion.source === "fallback" ? (
          <Badge tone="warning">{isAr ? "تقريبي" : "repli"}</Badge>
        ) : null}
      </div>
      <p className="text-sm text-ink-muted" dir="auto">{suggestion.neutralSummary}</p>
      <div className="mt-3 rounded-lg bg-surface p-3 text-sm">
        <div className="text-xs font-semibold text-ink-muted">
          {isAr ? "حل مقترح" : "Résolution suggérée"}
        </div>
        <p className="mt-1" dir="auto">{suggestion.suggestedResolution}</p>
        <Badge tone="info" className="mt-2">
          {REMEDY_LABEL[suggestion.suggestedRemedyType as RequestedRemedy]?.[locale] ??
            suggestion.suggestedRemedyType}
        </Badge>
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">
        {isAr
          ? "اقتراح غير مُلزِم — القرار لك."
          : "Suggestion non contraignante — la décision vous appartient."}
      </p>
    </Card>
  );
}

function SuggestionPending({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  return (
    <Card className="border-border bg-primary-tint p-5">
      <h3 className="text-[15px] font-semibold text-primary-deep">
        {isAr ? "مساعدة الذكاء الاصطناعي" : "Assistance IA"}
      </h3>
      <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
        <span className="dot bg-primary animate-pulse" />
        {isAr ? "جارٍ تحليل الملف…" : "Analyse du dossier…"}
      </div>
    </Card>
  );
}
