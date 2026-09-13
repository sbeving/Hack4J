"use client";

import { Card, Badge, Button, cn } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { formatMillimes, tndToMillimes } from "@/lib/money";
import { REMEDY_LABEL, type Locale, type RequestedRemedy } from "@/lib/domain/constants";
import type { MediationBrief } from "@/lib/ai/mediation-tasks";

type Readiness = MediationBrief["readiness"];
const READINESS_ORDER: Readiness[] = ["far", "close", "aligned"];
const READINESS: Record<Readiness, { bar: string; text: string; fr: string; ar: string }> = {
  far: { bar: "bg-warning", text: "text-warning-deep", fr: "Écart important", ar: "الفارق كبير" },
  close: { bar: "bg-cobalt", text: "text-cobalt", fr: "Proche d'un accord", ar: "قريب من الاتفاق" },
  aligned: { bar: "bg-success", text: "text-success", fr: "Accord à portée", ar: "الاتفاق في المتناول" },
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
  const readyIdx = READINESS_ORDER.indexOf(brief.readiness);

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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-cobalt text-surface">
            <Icon name="handshake" size={18} />
          </span>
          <div className="leading-tight">
            <h3 className="text-[15px] font-semibold text-cobalt">{L.title}</h3>
            {brief.source === "fallback" ? (
              <Badge tone="warning" className="mt-0.5">
                {L.fallback}
              </Badge>
            ) : null}
          </div>
        </div>
        {/* Readiness gauge — distance to agreement */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1">
            {READINESS_ORDER.map((s, i) => (
              <span key={s} className={cn("h-1.5 w-6 rounded-full", i <= readyIdx ? ready.bar : "bg-cobalt/15")} />
            ))}
          </div>
          <span className={cn("text-[11px] font-semibold", ready.text)}>{isAr ? ready.ar : ready.fr}</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-ink" dir="auto">
        {brief.neutralSummary}
      </p>

      {brief.gapAnalysis ? (
        <p className="mt-2 text-xs text-ink-muted" dir="auto">
          <span className="font-semibold">{L.gap} : </span>
          {brief.gapAnalysis}
        </p>
      ) : null}

      <div className="mt-3 rounded-lg bg-surface p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-muted">{L.compromise}</span>
          <div className="flex items-center gap-2">
            <Badge tone="cobalt">
              {REMEDY_LABEL[comp.remedyType as RequestedRemedy]?.[locale] ?? comp.remedyType}
            </Badge>
            {comp.amountTnd != null ? (
              <span className="font-display text-base font-bold text-cobalt">
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
            className="mt-3 w-full sm:w-auto"
            icon="check"
            onClick={() => window.dispatchEvent(new CustomEvent("sulha:open-remedy"))}
          >
            {L.use}
          </Button>
        ) : null}
      </div>

      {nudge ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-cobalt/20 bg-surface/60 p-3">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-cobalt-tint text-cobalt">
            <Icon name="sparkle" size={12} />
          </span>
          <div>
            <div className="text-xs font-semibold text-cobalt">{L.forYou}</div>
            <p className="mt-0.5 text-sm text-ink" dir="auto">
              {nudge}
            </p>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] text-ink-muted">{L.disclaimer}</p>
    </Card>
  );
}
