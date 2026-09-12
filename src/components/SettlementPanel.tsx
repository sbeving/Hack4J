import { acknowledgeTermsAction } from "@/lib/domain/settlement-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Badge, SectionHead } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { formatMillimes } from "@/lib/money";
import { REMEDY_LABEL, label, type Locale } from "@/lib/domain/constants";

type SettlementLite = {
  id: string;
  version: number;
  status: string;
  termsHash: string;
  terms: string;
  pdfKey: string | null;
  acknowledgements: string | null;
};
type MediationLite = { id: string; scheduledAt: Date | null; settlements: SettlementLite[] };

export function SettlementPanel({
  caseId,
  role,
  mediations,
  locale,
}: {
  caseId: string;
  role: "claimant" | "provider_agent" | "resolver";
  mediations: MediationLite[];
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const mediation = mediations[0];
  if (!mediation) return null;

  const settlement = mediation.settlements[0];
  let terms: { obligations?: string; remedyType?: string; amountMillimes?: number | null; performanceDate?: string | null } = {};
  let acks: { party: string; at: string }[] = [];
  if (settlement) {
    try {
      terms = JSON.parse(settlement.terms);
    } catch {
      /* ignore */
    }
    try {
      acks = JSON.parse(settlement.acknowledgements ?? "[]");
    } catch {
      /* ignore */
    }
  }
  const myParty = role === "claimant" ? "claimant" : role === "provider_agent" ? "provider" : null;
  const alreadyAck = myParty ? acks.some((a) => a.party === myParty) : false;

  return (
    <Card className="p-5">
      <SectionHead className="mb-2">
        {isAr ? "الوساطة والتسوية" : "Médiation & règlement"}
      </SectionHead>

      <p className="text-sm text-ink-muted">
        {mediation.scheduledAt
          ? (isAr ? "الجلسة: " : "Séance : ") + new Date(mediation.scheduledAt).toLocaleString(isAr ? "ar-TN" : "fr-TN")
          : isAr
            ? "لم يُحدَّد موعد بعد."
            : "Séance à programmer."}
      </p>

      {settlement ? (
        <div className="mt-3 rounded-lg border border-border bg-success-tint p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {isAr ? "الشروط المقترحة" : "Termes proposés"} · v{settlement.version}
            </span>
            {settlement.status === "recorded" ? (
              <Badge tone="success">{isAr ? "مُسجَّل" : "enregistré"}</Badge>
            ) : (
              <Badge tone="info">{isAr ? "بانتظار الإقرار" : "en attente d'accusé"}</Badge>
            )}
          </div>
          {terms.obligations ? <p className="mt-2 whitespace-pre-wrap text-sm text-ink" dir="auto">{terms.obligations}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {terms.remedyType ? (
              <Badge tone="neutral">{label(REMEDY_LABEL as Record<string, Record<Locale, string>>, terms.remedyType, locale, terms.remedyType)}</Badge>
            ) : null}
            {terms.amountMillimes != null ? <Badge tone="neutral">{formatMillimes(terms.amountMillimes, locale)}</Badge> : null}
          </div>

          <div className="mt-2 text-xs text-ink-muted">
            {isAr ? "الإقرارات: " : "Accusés : "}
            {acks.length ? acks.map((a) => a.party).join(", ") : isAr ? "لا شيء" : "aucun"}
          </div>

          {settlement.status === "recorded" && settlement.pdfKey ? (
            <a
              href={`/api/settlements/${settlement.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-sand"
            >
              <Icon name="document" /> {isAr ? "محضر الصلح (PV)" : "PV de Conciliation"}
            </a>
          ) : myParty && !alreadyAck ? (
            <form action={acknowledgeTermsAction.bind(null, caseId, settlement.id)} className="mt-3">
              <SubmitButton>{isAr ? "الإقرار بالشروط" : "Accuser réception des termes"}</SubmitButton>
            </form>
          ) : myParty && alreadyAck ? (
            <p className="mt-2 text-xs text-success">{isAr ? "لقد أقررت بالشروط." : "Vous avez accusé réception."}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">{isAr ? "لا توجد شروط مقترحة بعد." : "Aucun accord proposé pour l'instant."}</p>
      )}
    </Card>
  );
}
