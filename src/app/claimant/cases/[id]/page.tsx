import { notFound } from "next/navigation";
import { requireRole, getLocale } from "@/lib/session";
import { getCaseForClaimant } from "@/lib/domain/cases";
import { submitClaimAction, withdrawClaimAction } from "@/lib/domain/claim-actions";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/nav/BackLink";
import { Card, Badge, PageTitle, SectionHead } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { SlaCountdown } from "@/components/SlaCountdown";
import { SubmitButton } from "@/components/SubmitButton";
import { Tracker } from "@/components/Tracker";
import { EvidenceUploadForm } from "@/components/claimant/EvidenceUploadForm";
import { EvidenceReviewCard } from "@/components/claimant/EvidenceReviewCard";
import { NoticePanel } from "@/components/claimant/NoticePanel";
import { ResolutionPanel } from "@/components/claimant/ResolutionPanel";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { verifyMany } from "@/lib/integrity";
import { EscalationPanel } from "@/components/claimant/EscalationPanel";
import { DossierPanel } from "@/components/DossierPanel";
import { SettlementPanel } from "@/components/SettlementPanel";
import { AuditTimeline } from "@/components/AuditTimeline";
import { MediatorCard } from "@/components/mediation/MediatorCard";
import { MediatorChat } from "@/components/mediation/MediatorChat";
import { MediationReport } from "@/components/mediation/MediationReport";
import {
  getOrCreateMediationBrief,
  getMediationMessages,
  buildMediationReport,
} from "@/lib/domain/mediation";
import { escalationEligibility } from "@/lib/domain/escalation";
import { formatMillimes } from "@/lib/money";
import {
  CLAIM_TYPE_LABEL,
  CLAIM_TYPE_DESK,
  PRIORITY_LABEL,
  REMEDY_LABEL,
  ROLE_LABEL,
  STATE_LABEL,
  type CaseState,
  type ClaimType,
  type Priority,
  type RequestedRemedy,
} from "@/lib/domain/constants";

const SLA_STATES: CaseState[] = ["notice_sent", "provider_review", "resolution_proposed"];

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
  const dossier = c.dossiers[0] ?? null;
  const elig =
    ["notice_sent", "provider_review", "resolution_proposed"].includes(state) && !dossier
      ? await escalationEligibility(c.id, user.id)
      : null;

  const business = isAr && user.org?.nameAr ? user.org.nameAr : user.org?.name;

  // AI mediator — only during the pre-escalation negotiation window.
  const inNegotiation = ["notice_sent", "provider_review", "resolution_proposed"].includes(state);
  const brief = inNegotiation ? await getOrCreateMediationBrief(c.id) : null;
  const mediatorMessages = inNegotiation ? await getMediationMessages(c.id, "claimant") : [];
  const mediationReport = inNegotiation ? await buildMediationReport(c.id) : null;
  const reviewRequested = c.events.some((e) => e.type === "human_review_requested");

  return (
    <AppShell user={user} locale={locale}>
      <BackLink
        href="/claimant"
        locale={locale}
        label={isAr ? "مطالبي" : "Mes réclamations"}
      />
      <div className="card-flat mb-5 flex items-center justify-between gap-3 border-s-[3px] border-s-primary p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-tint text-primary-deep">
            <Icon name="workshop" size={20} />
          </span>
          <div>
            <div className="text-xs text-ink-muted">{ROLE_LABEL.claimant[locale]}</div>
            <div className="font-semibold text-ink">{business ?? "—"}</div>
          </div>
        </div>
        {slaDueAtISO && SLA_STATES.includes(state) ? (
          <SlaCountdown dueAtISO={slaDueAtISO} serverNowISO={serverNowISO} locale={locale} />
        ) : null}
      </div>

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

      {inNegotiation && brief ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <MediatorCard brief={brief} party="claimant" locale={locale} />
            <MediatorChat caseId={c.id} party="claimant" messages={mediatorMessages} locale={locale} />
          </div>
          {mediationReport ? (
            <MediationReport
              caseId={c.id}
              party="claimant"
              report={mediationReport}
              reviewRequested={reviewRequested}
              locale={locale}
            />
          ) : null}
        </div>
      ) : null}

      {dossier ? (
        <div className="mt-6">
          <DossierPanel dossier={dossier} locale={locale} />
        </div>
      ) : elig?.eligible ? (
        <div className="mt-6">
          <EscalationPanel caseId={c.id} reason={elig.reason} locale={locale} />
        </div>
      ) : null}

      {c.mediations.length ? (
        <div className="mt-6">
          <SettlementPanel caseId={c.id} role="claimant" mediations={c.mediations} locale={locale} />
        </div>
      ) : null}

      {c.anchors.length ? (
        <div className="mt-6">
          <AuditTimeline events={c.events} anchors={c.anchors} locale={locale} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: summary + AI classification */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <SectionHead className="mb-3">{isAr ? "الملخّص" : "Résumé"}</SectionHead>
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
            <p className="mt-3 border-t border-border pt-3 text-sm text-ink-muted" dir="auto">
              {c.narrative}
            </p>
          </Card>

          <Card className="p-5">
            <SectionHead className="mb-3">
              {isAr ? "التصنيف بالذكاء الاصطناعي" : "Classification IA"}
            </SectionHead>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">{CLAIM_TYPE_LABEL[c.claimType as ClaimType][locale]}</Badge>
              <Badge tone="info">
                {isAr ? "أولوية: " : "Priorité : "}
                {PRIORITY_LABEL[c.priority as Priority][locale]}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              {isAr ? "التوجيه إلى: " : "Routé vers : "}
              <span className="font-semibold text-ink">
                {CLAIM_TYPE_DESK[c.claimType as ClaimType][locale]}
              </span>
            </p>
          </Card>
        </div>

        {/* Right: evidence */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <SectionHead>
              {isAr ? "الأدلة" : "Preuves"} ({c.evidence.length})
            </SectionHead>
          </div>

          {state === "draft" ? (
            <EvidenceUploadForm caseId={c.id} locale={locale} />
          ) : null}

          {c.evidence.length === 0 ? (
            <Card className="p-6 text-center text-sm text-ink-muted">
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
                          <span className="text-[11px] text-ink-muted">keccak256 {shortHash(ev.contentHash)}</span>
                          <IntegrityBadge status={integrity.get(ev.id)} isAr={isAr} />
                        </div>
                      </div>
                      {ev.reviewState === "confirmed" ? (
                        <Badge tone="success">{isAr ? "مؤكّد" : "confirmé"}</Badge>
                      ) : null}
                    </div>

                    {ex && ev.reviewState === "needs_confirmation" && state === "draft" ? (
                      <EvidenceReviewCard
                        caseId={c.id}
                        evidenceId={ev.id}
                        extraction={ex}
                        providerOrgId={c.providerOrgId}
                        claimType={c.claimType as ClaimType}
                        locale={locale}
                      />
                    ) : ex ? (
                      <ConfirmedExtraction extraction={ex} isAr={isAr} />
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Draft submit action */}
          {state === "draft" ? (
            <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary-tint p-4">
              <p className="text-sm text-ink">
                {isAr
                  ? "بعد إضافة الأدلة، أودِع المطلب لتوليد الإنذار الرسمي."
                  : "Une fois les preuves ajoutées, déposez la réclamation pour générer la mise en demeure."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <form action={withdrawClaimAction.bind(null, c.id)}>
                  <SubmitButton
                    variant="outline"
                    className="border-danger/40 text-danger hover:bg-danger-tint"
                    pendingLabel={isAr ? "جارٍ الإلغاء…" : "Abandon…"}
                  >
                    {isAr ? "إلغاء المطلب" : "Abandonner la réclamation"}
                  </SubmitButton>
                </form>
                <form action={submitClaimAction.bind(null, c.id)}>
                  <SubmitButton pendingLabel={isAr ? "جارٍ الإيداع…" : "Dépôt…"}>
                    {isAr ? "إيداع المطلب" : "Déposer la réclamation"}
                  </SubmitButton>
                </form>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function ConfirmedExtraction({ extraction: ex, isAr }: { extraction: Extraction; isAr: boolean }) {
  return (
    <div className="mt-3 rounded-lg bg-surface-sand p-3 text-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-semibold text-primary">
          {isAr ? "استخراج بالذكاء الاصطناعي" : "Extraction IA"}
        </span>
      </div>
      {ex.summary ? (
        <p className="text-ink" dir="auto">
          {ex.summary}
        </p>
      ) : null}
      {(ex.amountTnd != null || ex.reference || ex.providerName || ex.documentDate) && (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {ex.amountTnd != null ? (
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">{isAr ? "المبلغ" : "Montant"}</dt>
              <dd className="text-end font-medium">{ex.amountTnd} TND</dd>
            </div>
          ) : null}
          {ex.reference ? (
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">{isAr ? "المرجع" : "Référence"}</dt>
              <dd className="text-end font-medium" dir="auto">
                {ex.reference}
              </dd>
            </div>
          ) : null}
          {ex.providerName ? (
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">{isAr ? "المزوّد" : "Fournisseur"}</dt>
              <dd className="text-end font-medium" dir="auto">
                {ex.providerName}
              </dd>
            </div>
          ) : null}
          {ex.documentDate ? (
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">{isAr ? "التاريخ" : "Date"}</dt>
              <dd className="text-end font-medium" dir="auto">
                {ex.documentDate}
              </dd>
            </div>
          ) : null}
        </dl>
      )}
      {ex.fields && ex.fields.length > 0 ? (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {ex.fields.slice(0, 6).map((f, i) => (
            <div key={i} className="flex justify-between gap-2">
              <dt className="text-ink-muted">{f.label}</dt>
              <dd className="text-end font-medium" dir="auto">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-end font-medium">{value}</dd>
    </div>
  );
}
