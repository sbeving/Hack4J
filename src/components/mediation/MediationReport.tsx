"use client";

import { useState } from "react";
import { requestHumanReviewAction } from "@/lib/domain/mediation-actions";
import { AuditTimeline } from "@/components/AuditTimeline";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/domain/constants";
import type { MediationReport as Report } from "@/lib/domain/mediation";

export function MediationReport({
  caseId,
  party,
  report,
  reviewRequested,
  locale,
}: {
  caseId: string;
  party: "claimant" | "provider";
  report: Report;
  reviewRequested: boolean;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const [open, setOpen] = useState(false);
  const { summary } = report;

  const L = {
    toggle: isAr ? "تقرير الوساطة" : "Rapport de médiation",
    intro: isAr
      ? "تقرير كامل يمكن تسليمه لمُراجِع بشري: ملخّص محايد + سجلّ التتبّع على السلسلة."
      : "Rapport complet remis à un réviseur humain : synthèse neutre + journal de suivi on-chain.",
    summary: isAr ? "ملخّص محايد" : "Synthèse neutre",
    claimant: isAr ? "موقف المشتكي" : "Position du réclamant",
    provider: isAr ? "موقف المزوّد" : "Position du fournisseur",
    issues: isAr ? "نقاط عالقة" : "Points non résolus",
    fallback: isAr ? "تقريبي" : "repli",
    request: isAr ? "طلب مُراجِع بشري" : "Demander un réviseur humain",
    requesting: isAr ? "جارٍ الطلب…" : "Demande…",
    requested: isAr ? "تم طلب مُراجِع بشري" : "Réviseur humain demandé",
    note: isAr
      ? "بدون تغيير لحالة الملف — الطلب مُسجَّل في سجلّ التدقيق."
      : "Sans changer l'état du dossier — la demande est inscrite au registre d'audit.",
  };

  return (
    <Card className="p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-start"
      >
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cobalt-tint text-cobalt">
            <Icon name="dossier" size={16} />
          </span>
          <span className="text-[15px] font-semibold text-ink">{L.toggle}</span>
        </span>
        <Icon name="chevron" className={open ? "-rotate-90" : "rotate-90"} size={16} />
      </button>

      {open ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-ink-muted">{L.intro}</p>

          <div className="rounded-lg bg-surface-sand p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-muted">{L.summary}</span>
              {summary.source === "fallback" ? <Badge tone="warning">{L.fallback}</Badge> : null}
            </div>
            <p className="text-sm text-ink" dir="auto">
              {summary.neutralSummary}
            </p>
            {summary.claimantPosition ? (
              <p className="mt-2 text-sm" dir="auto">
                <span className="font-semibold">{L.claimant} : </span>
                {summary.claimantPosition}
              </p>
            ) : null}
            {summary.providerPosition ? (
              <p className="mt-1 text-sm" dir="auto">
                <span className="font-semibold">{L.provider} : </span>
                {summary.providerPosition}
              </p>
            ) : null}
            {summary.unresolvedIssues.length > 0 ? (
              <div className="mt-2">
                <span className="text-sm font-semibold">{L.issues}</span>
                <ul className="mt-1 list-disc space-y-0.5 ps-5 text-sm text-ink-muted">
                  {summary.unresolvedIssues.map((it, i) => (
                    <li key={i} dir="auto">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {report.anchors.length > 0 ? (
            <AuditTimeline events={report.events} anchors={report.anchors} locale={locale} />
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            {reviewRequested ? (
              <Badge tone="cobalt" dot>
                {L.requested}
              </Badge>
            ) : (
              <form action={requestHumanReviewAction.bind(null, caseId, party)}>
                <SubmitButton variant="cobalt" pendingLabel={L.requesting}>
                  {L.request}
                </SubmitButton>
              </form>
            )}
            <span className="text-[11px] text-ink-muted">{L.note}</span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
