import { notFound } from "next/navigation";
import { requireRole, getLocale } from "@/lib/session";
import { getProviderCase, getOrCreateSuggestion } from "@/lib/domain/provider";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, PageTitle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { SlaCountdown } from "@/components/SlaCountdown";
import { Tracker } from "@/components/Tracker";
import { ProviderActions } from "@/components/provider/ProviderActions";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { SettlementPanel } from "@/components/SettlementPanel";
import { MediatorCard } from "@/components/mediation/MediatorCard";
import { MediatorChat } from "@/components/mediation/MediatorChat";
import { MediationReport } from "@/components/mediation/MediationReport";
import {
  getOrCreateMediationBrief,
  getMediationMessages,
  buildMediationReport,
} from "@/lib/domain/mediation";
import { verifyMany } from "@/lib/integrity";
import { formatMillimes, millimesToTnd } from "@/lib/money";
import {
  CLAIM_TYPE_LABEL,
  REMEDY_LABEL,
  STATE_LABEL,
  type CaseState,
  type ClaimType,
  type RequestedRemedy,
} from "@/lib/domain/constants";

const SLA_STATES: CaseState[] = ["notice_sent", "provider_review", "resolution_proposed"];

function shortHash(h: string) {
  return h.length > 20 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}
function exSummary(s: string | null): string {
  if (!s) return "";
  try {
    return (JSON.parse(s) as { summary?: string }).summary ?? "";
  } catch {
    return "";
  }
}

export default async function ProviderCaseDetail({ params }: PageProps<"/provider/cases/[id]">) {
  const { id } = await params;
  const user = await requireRole("provider_agent");
  const locale = await getLocale();
  const isAr = locale === "ar";

  const c = await getProviderCase(id, user.orgId ?? "");
  if (!c) notFound();

  const suggestion = await getOrCreateSuggestion(id, user.orgId ?? "");
  const state = c.state as CaseState;
  const business = isAr && c.claimantUser.org?.nameAr ? c.claimantUser.org.nameAr : c.claimantUser.org?.name;
  const serverNowISO = new Date().toISOString();
  const integrity = await verifyMany(c.evidence);
  const sentNotice = c.notices.find((n) => n.status === "sent");
  const responses = c.responses.filter((r) => r.kind !== "ai_suggestion" && r.kind !== "ai_mediation");

  // AI mediator — only during the pre-escalation negotiation window.
  const inNegotiation = ["notice_sent", "provider_review", "resolution_proposed"].includes(state);
  const canPropose = ["notice_sent", "provider_review"].includes(state);
  const brief = inNegotiation ? await getOrCreateMediationBrief(c.id) : null;
  const mediatorMessages = inNegotiation ? await getMediationMessages(c.id, "provider") : [];
  const mediationReport = inNegotiation ? await buildMediationReport(c.id) : null;
  const reviewRequested = c.events.some((e) => e.type === "human_review_requested");
  const compromiseRemedy = brief?.suggestedCompromise.remedyType ?? suggestion?.suggestedRemedyType ?? "correct_bill";
  const compromiseAmountTnd =
    brief?.suggestedCompromise.amountTnd ?? millimesToTnd(c.amountMillimes);

  const brand = (() => {
    try {
      return JSON.parse(c.providerOrg.branding ?? "{}") as { color?: string; initials?: string };
    } catch {
      return {};
    }
  })();

  return (
    <AppShell user={user} locale={locale}>
      <div className="card-flat mb-5 flex items-center justify-between gap-3 border-s-[3px] p-4" style={{ borderInlineStartColor: brand.color ?? "var(--primary)" }}>
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-lg text-xs font-bold text-white"
            style={{ background: brand.color ?? "var(--primary)" }}
          >
            {brand.initials ?? "?"}
          </span>
          <div>
            <div className="text-xs text-ink-muted">{isAr ? "مكتب المزوّد" : "Guichet fournisseur"}</div>
            <div className="font-semibold text-ink">{isAr && c.providerOrg.nameAr ? c.providerOrg.nameAr : c.providerOrg.name}</div>
          </div>
        </div>
        {c.slaDueAt && SLA_STATES.includes(state) ? (
          <SlaCountdown dueAtISO={new Date(c.slaDueAt).toISOString()} serverNowISO={serverNowISO} locale={locale} />
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle title={c.caseNumber} subtitle={`${CLAIM_TYPE_LABEL[c.claimType as ClaimType][locale]} · ${business}`} />
        <Badge tone="brand">{STATE_LABEL[state][locale]}</Badge>
      </div>

      <Card className="p-6">
        <Tracker state={state} locale={locale} />
      </Card>

      {inNegotiation && brief ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <MediatorCard brief={brief} party="provider" canUseCompromise={canPropose} locale={locale} />
            <MediatorChat caseId={c.id} party="provider" messages={mediatorMessages} locale={locale} />
          </div>
          {mediationReport ? (
            <MediationReport
              caseId={c.id}
              party="provider"
              report={mediationReport}
              reviewRequested={reviewRequested}
              locale={locale}
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <h3 className="mb-3 text-[15px] font-semibold text-ink">{isAr ? "المطلب" : "Réclamation"}</h3>
            <dl className="space-y-2 text-sm">
              <Row label={isAr ? "العميل" : "Client"} value={business ?? "—"} />
              <Row label={isAr ? "المبلغ المتنازع" : "Montant contesté"} value={formatMillimes(c.amountMillimes, locale)} />
              {c.reference ? <Row label={isAr ? "المرجع" : "Référence"} value={c.reference} /> : null}
            </dl>
            <p className="mt-3 border-t border-border pt-3 text-sm text-ink-muted" dir="auto">{c.narrative}</p>
            {sentNotice ? (
              <a href={`/api/notices/${sentNotice.id}/pdf`} target="_blank" rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <Icon name="document" className="h-4 w-4" /> {isAr ? "الإنذار الرسمي" : "Mise en demeure"}
              </a>
            ) : null}
          </Card>

          {suggestion ? (
            <Card className="border-border bg-primary-tint p-5">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-primary-deep">
                  {isAr ? "مساعدة الذكاء الاصطناعي" : "Assistance IA"}
                </h3>
                {suggestion.source === "fallback" ? <Badge tone="warning">{isAr ? "تقريبي" : "repli"}</Badge> : null}
              </div>
              <p className="text-sm text-ink-muted" dir="auto">{suggestion.neutralSummary}</p>
              <div className="mt-3 rounded-lg bg-surface p-3 text-sm">
                <div className="text-xs font-semibold text-ink-muted">{isAr ? "حل مقترح" : "Résolution suggérée"}</div>
                <p className="mt-1" dir="auto">{suggestion.suggestedResolution}</p>
                <Badge tone="info" className="mt-2">
                  {REMEDY_LABEL[suggestion.suggestedRemedyType as RequestedRemedy]?.[locale] ?? suggestion.suggestedRemedyType}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] text-ink-muted">{isAr ? "اقتراح غير مُلزِم — القرار لك." : "Suggestion non contraignante — la décision vous appartient."}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Verified evidence */}
          <div>
            <h3 className="mb-2 text-[15px] font-semibold text-ink">
              {isAr ? "الأدلة المُتحقَّقة" : "Preuves vérifiées"} ({c.evidence.length})
            </h3>
            {c.evidence.length === 0 ? (
              <Card className="p-4 text-sm text-ink-muted">{isAr ? "لا توجد أدلة." : "Aucune preuve."}</Card>
            ) : (
              <div className="space-y-2">
                {c.evidence.map((ev) => (
                  <Card key={ev.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{ev.filename}</span>
                      <IntegrityBadge status={integrity.get(ev.id)} isAr={isAr} />
                    </div>
                    <div className="text-[11px] text-ink-muted">keccak256 {shortHash(ev.contentHash)}</div>
                    {exSummary(ev.extracted) ? (
                      <p className="mt-1 text-sm text-ink-muted" dir="auto">{exSummary(ev.extracted)}</p>
                    ) : null}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Response history */}
          {responses.length > 0 ? (
            <div>
              <h3 className="mb-2 text-[15px] font-semibold text-ink">{isAr ? "التبادلات" : "Échanges"}</h3>
              <div className="space-y-2">
                {responses.map((r) => (
                  <Card key={r.id} className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge tone={r.kind === "contest" ? "danger" : r.kind === "remedy_proposal" ? "success" : "neutral"}>
                        {r.kind}
                      </Badge>
                      {r.amountMillimes ? <span className="font-semibold">{formatMillimes(r.amountMillimes, locale)}</span> : null}
                    </div>
                    {r.message ? <p className="mt-1 text-ink-muted" dir="auto">{r.message}</p> : null}
                    {r.claimantDisposition && r.claimantDisposition !== "pending" ? (
                      <div className="mt-1 text-xs text-ink-muted">{isAr ? "رد العميل: " : "Client : "}{r.claimantDisposition}</div>
                    ) : null}
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {c.mediations.length ? (
            <SettlementPanel caseId={c.id} role="provider_agent" mediations={c.mediations} locale={locale} />
          ) : null}

          {/* Actions */}
          <Card className="p-4">
            <ProviderActions
              caseId={c.id}
              state={state}
              suggestedRemedyType={compromiseRemedy}
              suggestedAmountTnd={compromiseAmountTnd}
              locale={locale}
            />
          </Card>
        </div>
      </div>
    </AppShell>
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
