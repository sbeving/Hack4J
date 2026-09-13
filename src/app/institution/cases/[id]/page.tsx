import { notFound } from "next/navigation";
import { requireRole, getLocale } from "@/lib/session";
import { getResolverCase } from "@/lib/domain/resolver";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/nav/BackLink";
import { Card, Badge, PageTitle, SectionHead } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Tracker } from "@/components/Tracker";
import { IntegrityBadge } from "@/components/IntegrityBadge";
import { DossierPanel } from "@/components/DossierPanel";
import { SettlementPanel } from "@/components/SettlementPanel";
import { AuditTimeline } from "@/components/AuditTimeline";
import { ResolverActions } from "@/components/institution/ResolverActions";
import { verifyMany } from "@/lib/integrity";
import { formatMillimes } from "@/lib/money";
import { CLAIM_TYPE_LABEL, STATE_LABEL, label, type CaseState } from "@/lib/domain/constants";

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

export default async function ResolverCaseDetail({ params }: PageProps<"/institution/cases/[id]">) {
  const { id } = await params;
  const user = await requireRole("resolver");
  const locale = await getLocale();
  const isAr = locale === "ar";

  const c = await getResolverCase(id, user.orgId ?? "");
  if (!c) notFound();

  const state = c.state as CaseState;
  const integrity = await verifyMany(c.evidence);
  const dossier = c.dossiers[0] ?? null;
  const business = isAr && c.claimantUser.org?.nameAr ? c.claimantUser.org.nameAr : c.claimantUser.org?.name;

  const mediation = c.mediations[0];
  const latestSettlement = mediation?.settlements[0];
  const currentSettlementId = state === "settlement_pending" ? (latestSettlement?.id ?? null) : null;
  let acks: { party: string }[] = [];
  try {
    acks = latestSettlement ? JSON.parse(latestSettlement.acknowledgements ?? "[]") : [];
  } catch {
    acks = [];
  }
  const bothAcknowledged = acks.some((a) => a.party === "claimant") && acks.some((a) => a.party === "provider");

  return (
    <AppShell user={user} locale={locale}>
      <BackLink
        href="/institution"
        locale={locale}
        label={isAr ? "الملفّات المصعّدة" : "Dossiers escaladés"}
      />
      <div className="card-flat mb-5 flex items-center gap-3 border-s-[3px] border-s-cobalt p-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-cobalt-tint text-cobalt">
          <Icon name="scales" size={20} />
        </span>
        <div>
          <div className="text-xs text-ink-muted">{isAr ? "الوحدة المؤسّسية المحايدة" : "Module institutionnel neutre"}</div>
          <div className="font-semibold text-ink">{isAr && c.institutionOrg?.nameAr ? c.institutionOrg.nameAr : c.institutionOrg?.name}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle title={c.caseNumber} subtitle={`${label(CLAIM_TYPE_LABEL, c.claimType, locale)} · ${business} → ${c.providerOrg.name}`} />
        <Badge tone="brand">{label(STATE_LABEL, c.state, locale)}</Badge>
      </div>

      <Card className="p-6">
        <Tracker state={state} locale={locale} />
      </Card>

      {c.anchors.length ? (
        <div className="mt-6">
          <AuditTimeline events={c.events} anchors={c.anchors} locale={locale} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5">
            <SectionHead>{isAr ? "الملفّ" : "Le litige"}</SectionHead>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">{isAr ? "المبلغ" : "Montant"}</dt><dd className="font-medium">{formatMillimes(c.amountMillimes, locale)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">{isAr ? "سبب التصعيد" : "Motif escalade"}</dt><dd className="text-end font-medium">{c.escalationReason ?? "—"}</dd></div>
            </dl>
            {dossier?.summary ? (
              <div className="mt-3 rounded-lg bg-primary-tint p-3 text-sm">
                <div className="text-xs font-semibold text-primary-deep">{isAr ? "ملخّص محايد (IA)" : "Résumé neutre (IA)"}</div>
                <p className="mt-1 text-ink" dir="auto">{dossier.summary}</p>
              </div>
            ) : null}
          </Card>

          {dossier ? <DossierPanel dossier={dossier} locale={locale} /> : null}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Tamper-check */}
          <div>
            <SectionHead>
              {isAr ? "التحقّق من سلامة الأدلة" : "Contrôle d'intégrité (tamper-check)"}
            </SectionHead>
            {c.evidence.length === 0 ? (
              <Card className="p-4 text-sm text-ink-muted">{isAr ? "لا أدلة." : "Aucune preuve."}</Card>
            ) : (
              <div className="space-y-2">
                {c.evidence.map((ev) => (
                  <Card key={ev.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{ev.filename}</span>
                      <IntegrityBadge status={integrity.get(ev.id)} isAr={isAr} />
                    </div>
                    <div className="text-[11px] text-ink-muted">keccak256 {shortHash(ev.contentHash)}</div>
                    {exSummary(ev.extracted) ? <p className="mt-1 text-sm text-ink-muted" dir="auto">{exSummary(ev.extracted)}</p> : null}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {mediation ? <SettlementPanel caseId={c.id} role="resolver" mediations={c.mediations} locale={locale} /> : null}

          <Card className="p-4">
            <ResolverActions
              caseId={c.id}
              state={state}
              currentSettlementId={currentSettlementId}
              bothAcknowledged={bothAcknowledged}
              locale={locale}
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
