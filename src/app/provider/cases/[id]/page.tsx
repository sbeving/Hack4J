import { notFound } from "next/navigation";
import { requireRole, getLocale } from "@/lib/session";
import { getProviderCase, getOrCreateSuggestion } from "@/lib/domain/provider";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, PageTitle } from "@/components/ui";
import { SlaCountdown } from "@/components/SlaCountdown";
import { Tracker } from "@/components/Tracker";
import { ProviderActions } from "@/components/provider/ProviderActions";
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
  const sentNotice = c.notices.find((n) => n.status === "sent");
  const responses = c.responses.filter((r) => r.kind !== "ai_suggestion");

  const brand = (() => {
    try {
      return JSON.parse(c.providerOrg.branding ?? "{}") as { color?: string; initials?: string };
    } catch {
      return {};
    }
  })();

  return (
    <AppShell user={user} locale={locale}>
      <div
        className="mb-5 flex items-center justify-between rounded-xl p-4 text-white"
        style={{ background: brand.color ?? "#0B6BB2" }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 text-xs font-black">
            {brand.initials ?? "?"}
          </span>
          <span className="font-bold">{isAr && c.providerOrg.nameAr ? c.providerOrg.nameAr : c.providerOrg.name}</span>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{isAr ? "المطلب" : "Réclamation"}</h3>
            <dl className="space-y-2 text-sm">
              <Row label={isAr ? "العميل" : "Client"} value={business ?? "—"} />
              <Row label={isAr ? "المبلغ المتنازع" : "Montant contesté"} value={formatMillimes(c.amountMillimes, locale)} />
              {c.reference ? <Row label={isAr ? "المرجع" : "Référence"} value={c.reference} /> : null}
            </dl>
            <p className="mt-3 border-t border-border pt-3 text-sm text-slate-600" dir="auto">{c.narrative}</p>
            {sentNotice ? (
              <a href={`/api/notices/${sentNotice.id}/pdf`} target="_blank" rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
                📄 {isAr ? "الإنذار الرسمي" : "Mise en demeure"}
              </a>
            ) : null}
          </Card>

          {suggestion ? (
            <Card className="border-indigo-200 bg-brand-soft/40 p-5">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-brand-ink">
                  {isAr ? "مساعدة الذكاء الاصطناعي" : "Assistance IA"}
                </h3>
                {suggestion.source === "fallback" ? <Badge tone="warning">{isAr ? "تقريبي" : "repli"}</Badge> : null}
              </div>
              <p className="text-sm text-slate-700" dir="auto">{suggestion.neutralSummary}</p>
              <div className="mt-3 rounded-lg bg-white p-3 text-sm">
                <div className="text-xs font-semibold uppercase text-muted">{isAr ? "حل مقترح" : "Résolution suggérée"}</div>
                <p className="mt-1" dir="auto">{suggestion.suggestedResolution}</p>
                <Badge tone="info" className="mt-2">
                  {REMEDY_LABEL[suggestion.suggestedRemedyType as RequestedRemedy]?.[locale] ?? suggestion.suggestedRemedyType}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] text-muted">{isAr ? "اقتراح غير مُلزِم — القرار لك." : "Suggestion non contraignante — la décision vous appartient."}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Verified evidence */}
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
              {isAr ? "الأدلة المُتحقَّقة" : "Preuves vérifiées"} ({c.evidence.length})
            </h3>
            {c.evidence.length === 0 ? (
              <Card className="p-4 text-sm text-muted">{isAr ? "لا توجد أدلة." : "Aucune preuve."}</Card>
            ) : (
              <div className="space-y-2">
                {c.evidence.map((ev) => (
                  <Card key={ev.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{ev.filename}</span>
                      <span className="shrink-0 text-xs text-emerald-600">✓ {isAr ? "بصمة سليمة" : "intègre"}</span>
                    </div>
                    <div className="font-mono text-[11px] text-muted">keccak256 {shortHash(ev.contentHash)}</div>
                    {exSummary(ev.extracted) ? (
                      <p className="mt-1 text-sm text-slate-600" dir="auto">{exSummary(ev.extracted)}</p>
                    ) : null}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Response history */}
          {responses.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{isAr ? "التبادلات" : "Échanges"}</h3>
              <div className="space-y-2">
                {responses.map((r) => (
                  <Card key={r.id} className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge tone={r.kind === "contest" ? "danger" : r.kind === "remedy_proposal" ? "success" : "neutral"}>
                        {r.kind}
                      </Badge>
                      {r.amountMillimes ? <span className="font-semibold">{formatMillimes(r.amountMillimes, locale)}</span> : null}
                    </div>
                    {r.message ? <p className="mt-1 text-slate-600" dir="auto">{r.message}</p> : null}
                    {r.claimantDisposition && r.claimantDisposition !== "pending" ? (
                      <div className="mt-1 text-xs text-muted">{isAr ? "رد العميل: " : "Client : "}{r.claimantDisposition}</div>
                    ) : null}
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <Card className="p-4">
            <ProviderActions
              caseId={c.id}
              state={state}
              suggestedRemedyType={suggestion?.suggestedRemedyType ?? "correct_bill"}
              suggestedAmountTnd={millimesToTnd(c.amountMillimes)}
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
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-medium">{value}</dd>
    </div>
  );
}
