import { acceptRemedyAction, declineRemedyAction } from "@/lib/domain/claim-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Badge, SectionHead } from "@/components/ui";
import { formatMillimes } from "@/lib/money";
import { isAiResponse, REMEDY_LABEL, type CaseState, type Locale, type RequestedRemedy } from "@/lib/domain/constants";

type Resp = {
  id: string;
  kind: string;
  message: string | null;
  remedyType: string | null;
  amountMillimes: number | null;
  claimantDisposition: string | null;
};

export function ResolutionPanel({
  caseId,
  state,
  responses,
  locale,
}: {
  caseId: string;
  state: CaseState;
  responses: Resp[];
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const visible = responses.filter((r) => !isAiResponse(r.kind));
  if (visible.length === 0) return null;

  const proposal =
    state === "resolution_proposed"
      ? [...visible].reverse().find((r) => r.kind === "remedy_proposal" && r.claimantDisposition === "pending")
      : undefined;

  const kindLabel: Record<string, string> = {
    acknowledgement: isAr ? "إقرار بالاستلام" : "Accusé de réception",
    info_request: isAr ? "طلب معلومة" : "Demande d'information",
    contest: isAr ? "اعتراض" : "Contestation",
    remedy_proposal: isAr ? "اقتراح حل" : "Proposition de résolution",
  };

  return (
    <Card className="p-5">
      <SectionHead className="mb-3">
        {isAr ? "ردود المزوّد" : "Réponses du fournisseur"}
      </SectionHead>

      <div className="space-y-2">
        {visible.map((r) => (
          <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <Badge tone={r.kind === "contest" ? "danger" : r.kind === "remedy_proposal" ? "success" : "neutral"}>
                {kindLabel[r.kind] ?? r.kind}
              </Badge>
              {r.amountMillimes ? <span className="font-semibold">{formatMillimes(r.amountMillimes, locale)}</span> : null}
            </div>
            {r.message ? <p className="mt-1 text-ink-muted" dir="auto">{r.message}</p> : null}
            {r.claimantDisposition && r.claimantDisposition !== "pending" ? (
              <div className="mt-1 text-xs text-ink-muted">
                {isAr ? "قرارك: " : "Votre décision : "}
                {r.claimantDisposition === "accepted" ? (isAr ? "قبول" : "accepté") : isAr ? "رفض" : "refusé"}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {proposal ? (
        <div className="mt-4 rounded-lg border border-border bg-success-tint p-4">
          <div className="font-semibold">
            {isAr ? "المزوّد يقترح: " : "Le fournisseur propose : "}
            {REMEDY_LABEL[proposal.remedyType as RequestedRemedy]?.[locale] ?? proposal.remedyType}
            {proposal.amountMillimes ? ` · ${formatMillimes(proposal.amountMillimes, locale)}` : ""}
          </div>
          {proposal.message ? <p className="mt-1 text-sm text-ink-muted" dir="auto">{proposal.message}</p> : null}
          <div className="mt-3 flex gap-2">
            <form action={acceptRemedyAction.bind(null, caseId, proposal.id)}>
              <SubmitButton>{isAr ? "تأكيد الحل" : "Confirmer la résolution"}</SubmitButton>
            </form>
            <form action={declineRemedyAction.bind(null, caseId, proposal.id)}>
              <SubmitButton variant="outline">{isAr ? "رفض" : "Refuser"}</SubmitButton>
            </form>
          </div>
        </div>
      ) : null}

      {state === "resolution_agreed" ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-cobalt/25 bg-cobalt-tint p-3 text-sm text-cobalt">
          <span className="dot mt-1.5 bg-cobalt" />
          <span>
            {isAr
              ? "لقد أكّدت الحل. بانتظار تأكيد المزوّد ليصبح الملف «مسوًّى» (اتفاق مباشر)."
              : "Vous avez confirmé. En attente de la confirmation du fournisseur pour passer en « Réglé » (accord direct)."}
          </span>
        </div>
      ) : null}
    </Card>
  );
}
