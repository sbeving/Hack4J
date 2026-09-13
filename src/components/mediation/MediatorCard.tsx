"use client";

import { Card, Badge, Button, StatusDot } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { formatMillimes, tndToMillimes } from "@/lib/money";
import { REMEDY_LABEL, type Locale, type RequestedRemedy } from "@/lib/domain/constants";
import type { MediationBrief } from "@/lib/ai/mediation-tasks";

const READINESS: Record<
  MediationBrief["readiness"],
  { tone: "warning" | "info" | "success"; fr: string; ar: string }
> = {
  far: { tone: "warning", fr: "Écart important", ar: "الفارق كبير" },
  close: { tone: "info", fr: "Proche d'un accord", ar: "قريب من الاتفاق" },
  aligned: { tone: "success", fr: "Accord à portée", ar: "الاتفاق في المتناول" },
};

export function MediatorCard({
  brief,
  party,
  canUseCompromise = false,
  locale,
}: {
  brief: MediationBrief;
  party: "claimant" | "provider";
  canUseCompromise?: boolean;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const comp = brief.suggestedCompromise;
  const nudge = party === "claimant" ? brief.claimantNudge : brief.providerNudge;
  const ready = READINESS[brief.readiness];

  const L = {
    title: isAr ? "الوسيط الآلي" : "Médiateur IA",
    gap: isAr ? "الفارق بين الموقفين" : "Écart entre les positions",
    compromise: isAr ? "تسوية مقترحة" : "Compromis suggéré",
    forYou: isAr ? "لك" : "Pour vous",
    use: isAr ? "استخدام هذه التسوية" : "Utiliser ce compromis",
    fallback: isAr ? "تقريبي" : "repli",
    disclaimer: isAr
      ? "اقتراح غير مُلزِم — القرار النهائي للطرفين معًا."
      : "Suggestion non contraignante — l'accord final revient aux deux parties.",
  };

  return (
    <Card className="border-s-[3px] border-s-cobalt bg-cobalt-tint p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cobalt text-white">
            <Icon name="handshake" size={17} />
          </span>
          <h3 className="text-[15px] font-semibold text-cobalt">{L.title}</h3>
          {brief.source === "fallback" ? <Badge tone="warning">{L.fallback}</Badge> : null}
        </div>
        <StatusDot tone={ready.tone}>{isAr ? ready.ar : ready.fr}</StatusDot>
      </div>

      <p className="text-sm text-ink" dir="auto">
        {brief.neutralSummary}
      </p>

      {brief.gapAnalysis ? (
        <p className="mt-2 text-xs text-ink-muted" dir="auto">
          <span className="font-semibold">{L.gap} : </span>
          {brief.gapAnalysis}
        </p>
      ) : null}

      <div className="mt-3 rounded-lg bg-surface p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-muted">{L.compromise}</span>
          <div className="flex items-center gap-2">
            <Badge tone="cobalt">
              {REMEDY_LABEL[comp.remedyType as RequestedRemedy]?.[locale] ?? comp.remedyType}
            </Badge>
            {comp.amountTnd != null ? (
              <span className="text-sm font-semibold text-ink">
                {formatMillimes(tndToMillimes(comp.amountTnd), locale)}
              </span>
            ) : null}
          </div>
        </div>
        {comp.rationale ? (
          <p className="mt-2 text-sm text-ink-muted" dir="auto">
            {comp.rationale}
          </p>
        ) : null}
        {party === "provider" && canUseCompromise ? (
          <Button
            variant="cobalt"
            size="sm"
            className="mt-3"
            icon="check"
            onClick={() => window.dispatchEvent(new CustomEvent("sulha:open-remedy"))}
          >
            {L.use}
          </Button>
        ) : null}
      </div>

      {nudge ? (
        <div className="mt-3 rounded-lg border border-cobalt/20 p-3">
          <div className="text-xs font-semibold text-cobalt">{L.forYou}</div>
          <p className="mt-1 text-sm text-ink" dir="auto">
            {nudge}
          </p>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] text-ink-muted">{L.disclaimer}</p>
    </Card>
  );
}
