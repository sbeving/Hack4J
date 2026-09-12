import { notFound } from "next/navigation";
import { requireRole, getLocale } from "@/lib/session";
import { getCaseForClaimant } from "@/lib/domain/cases";
import { submitClaimAction, confirmEvidenceAction } from "@/lib/domain/claim-actions";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, PageTitle } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Tracker } from "@/components/Tracker";
import { EvidenceUploadForm } from "@/components/claimant/EvidenceUploadForm";
import { NoticePanel } from "@/components/claimant/NoticePanel";
import { ResolutionPanel } from "@/components/claimant/ResolutionPanel";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { verifyMany } from "@/lib/integrity";
import { formatMillimes } from "@/lib/money";
import {
  CLAIM_TYPE_LABEL,
  CLAIM_TYPE_DESK,
  PRIORITY_LABEL,
  REMEDY_LABEL,
  STATE_LABEL,
  type CaseState,
  type ClaimType,
  type Priority,
  type RequestedRemedy,
} from "@/lib/domain/constants";

function stateTone(s: CaseState) {
  if (s === "resolved" || s === "settled") return "success" as const;
  if (s === "closed_unsettled" || s === "withdrawn") return "danger" as const;
  if (s === "draft") return "neutral" as const;
  return "brand" as const;
}

function shortHash(h: string) {
  return h.length > 20 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

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

function parseExtraction(s: string | null): Extraction | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as Extraction;
  } catch {
    return null;
  }
}

export default async function CaseDetailPage({
  params,
}: PageProps<"/claimant/cases/[id]">) {
  const { id } = await params;
  const user = await requireRole("claimant");
  const locale = await getLocale();
  const isAr = locale === "ar";

  const c = await getCaseForClaimant(id, user.id);
  if (!c) notFound();

  const state = c.state as CaseState;
  const provider = isAr && c.providerOrg.nameAr ? c.providerOrg.nameAr : c.providerOrg.name;
  const serverNowISO = new Date().toISOString();
  const slaDueAtISO = c.slaDueAt ? new Date(c.slaDueAt).toISOString() : null;
  const integrity = await verifyMany(c.evidence);

  return (
    <AppShell user={user} locale={locale}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle
          title={`${c.caseNumber}`}
          subtitle={CLAIM_TYPE_LABEL[c.claimType as ClaimType][locale] + " · " + provider}
        />
        <Badge tone={stateTone(state)}>{STATE_LABEL[state][locale]}</Badge>
      </div>

      {/* Tracker */}
      <Card className="p-6">
        <Tracker state={state} locale={locale} />
      </Card>

      {/* Formal notice + SLA (once filed) */}
      {state !== "draft" && state !== "withdrawn" ? (
        <div className="mt-6">
          <NoticePanel
            caseId={c.id}
            state={state}
            notices={c.notices.map((n) => ({
              id: n.id,
              status: n.status,
              version: n.version,
              sentAt: n.sentAt,
              deadlineDays: n.deadlineDays,
            }))}
            slaDueAtISO={slaDueAtISO}
            serverNowISO={serverNowISO}
            locale={locale}
          />
        </div>
      ) : null}

      {state !== "draft" ? (
        <div className="mt-6">
          <ResolutionPanel caseId={c.id} state={state} responses={c.responses} locale={locale} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: summary + AI classification */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
              {isAr ? "الملخّص" : "Résumé"}
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label={isAr ? "المزوّد" : "Fournisseur"} value={provider} />
              <Row
                label={isAr ? "المبلغ" : "Montant"}
                value={formatMillimes(c.amountMillimes, locale)}
              />
              {c.reference ? <Row label={isAr ? "المرجع" : "Référence"} value={c.reference} /> : null}
              {c.requestedRemedy ? (
                <Row
                  label={isAr ? "المطلوب" : "Demande"}
                  value={REMEDY_LABEL[c.requestedRemedy as RequestedRemedy]?.[locale] ?? c.requestedRemedy}
                />
              ) : null}
            </dl>
            <p className="mt-3 border-t border-border pt-3 text-sm text-slate-600" dir="auto">
              {c.narrative}
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
              {isAr ? "التصنيف بالذكاء الاصطناعي" : "Classification IA"}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{CLAIM_TYPE_LABEL[c.claimType as ClaimType][locale]}</Badge>
              <Badge tone="info">
                {isAr ? "أولوية: " : "Priorité : "}
                {PRIORITY_LABEL[c.priority as Priority][locale]}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted">
              {isAr ? "التوجيه إلى: " : "Routé vers : "}
              <span className="font-semibold text-foreground">
                {CLAIM_TYPE_DESK[c.claimType as ClaimType][locale]}
              </span>
            </p>
          </Card>
        </div>

        {/* Right: evidence */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
              {isAr ? "الأدلة" : "Preuves"} ({c.evidence.length})
            </h3>
          </div>

          {state === "draft" ? (
            <EvidenceUploadForm caseId={c.id} locale={locale} />
          ) : null}

          {c.evidence.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted">
              {isAr ? "لم تتم إضافة أي دليل بعد." : "Aucune preuve ajoutée pour l'instant."}
            </Card>
          ) : (
            <div className="space-y-3">
              {c.evidence.map((ev) => {
                const ex = parseExtraction(ev.extracted);
                return (
                  <Card key={ev.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold">{ev.filename}</span>
                          <Badge tone="neutral">{ev.kind}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted">keccak256 {shortHash(ev.contentHash)}</span>
                          <IntegrityBadge status={integrity.get(ev.id)} isAr={isAr} />
                        </div>
                      </div>
                      {ev.reviewState === "confirmed" ? (
                        <Badge tone="success">{isAr ? "مؤكّد" : "confirmé"}</Badge>
                      ) : (
                        <form action={confirmEvidenceAction.bind(null, c.id, ev.id)}>
                          <SubmitButton variant="outline" className="px-3 py-1 text-xs">
                            {isAr ? "تأكيد" : "Confirmer"}
                          </SubmitButton>
                        </form>
                      )}
                    </div>

                    {ex ? (
                      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-semibold text-brand">
                            {isAr ? "استخراج بالذكاء الاصطناعي" : "Extraction IA"}
                          </span>
                          {ex.source === "fallback" ? (
                            <Badge tone="warning">{isAr ? "غير متاح" : "indisponible"}</Badge>
                          ) : null}
                        </div>
                        {ex.summary ? <p className="text-slate-700" dir="auto">{ex.summary}</p> : null}
                        {ex.fields && ex.fields.length > 0 ? (
                          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {ex.fields.slice(0, 6).map((f, i) => (
                              <div key={i} className="flex justify-between gap-2">
                                <dt className="text-muted">{f.label}</dt>
                                <dd className="text-end font-medium" dir="auto">{f.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Draft submit action */}
          {state === "draft" ? (
            <Card className="flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-brand-soft/40 p-4">
              <p className="text-sm text-slate-700">
                {isAr
                  ? "بعد إضافة الأدلة، أودِع المطلب لتوليد الإنذار الرسمي."
                  : "Une fois les preuves ajoutées, déposez la réclamation pour générer la mise en demeure."}
              </p>
              <form action={submitClaimAction.bind(null, c.id)}>
                <SubmitButton pendingLabel={isAr ? "جارٍ الإيداع…" : "Dépôt…"}>
                  {isAr ? "إيداع المطلب" : "Déposer la réclamation"}
                </SubmitButton>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-medium">{value}</dd>
    </div>
  );
}
