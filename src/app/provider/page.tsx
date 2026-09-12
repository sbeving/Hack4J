import Link from "next/link";
import { requireRole, getLocale } from "@/lib/session";
import { getProviderQueue } from "@/lib/domain/provider";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card, Badge } from "@/components/ui";
import { SlaCountdown } from "@/components/SlaCountdown";
import { formatMillimes } from "@/lib/money";
import {
  CLAIM_TYPE_LABEL,
  STATE_LABEL,
  label,
  type CaseState,
} from "@/lib/domain/constants";

function stateTone(s: CaseState) {
  if (s === "resolved" || s === "settled") return "success" as const;
  if (s === "closed_unsettled" || s === "withdrawn") return "danger" as const;
  if (s === "escalation_pending" || s === "dossier_filed" || s === "in_mediation") return "warning" as const;
  return "brand" as const;
}

const SLA_STATES: CaseState[] = ["notice_sent", "provider_review", "resolution_proposed"];

export default async function ProviderHome() {
  const user = await requireRole("provider_agent");
  const locale = await getLocale();
  const isAr = locale === "ar";
  const cases = await getProviderQueue(user.orgId ?? "");
  const serverNowISO = new Date().toISOString();

  return (
    <AppShell user={user} locale={locale}>
      <PageTitle
        icon="stamp"
        title={isAr ? "قائمة المطالب" : "File d'attente des réclamations"}
        subtitle={isAr ? "مرتّبة حسب أقرب أجل (SLA)." : "Triées par échéance SLA la plus proche."}
      />

      {cases.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-muted">
          {isAr ? "لا توجد مطالب واردة." : "Aucune réclamation reçue."}
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const business = isAr && c.claimantUser.org?.nameAr ? c.claimantUser.org.nameAr : c.claimantUser.org?.name;
            const state = c.state as CaseState;
            return (
              <Link key={c.id} href={`/provider/cases/${c.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:border-border-strong">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{c.caseNumber}</span>
                      <Badge tone={stateTone(state)}>{label(STATE_LABEL, c.state, locale)}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-ink-muted">
                      {label(CLAIM_TYPE_LABEL, c.claimType, locale)} · {business} · {c.evidence.length}{" "}
                      {isAr ? "دليل" : "preuve(s)"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {c.slaDueAt && SLA_STATES.includes(state) ? (
                      <SlaCountdown
                        dueAtISO={new Date(c.slaDueAt).toISOString()}
                        serverNowISO={serverNowISO}
                        locale={locale}
                      />
                    ) : null}
                    <div className="text-end font-semibold">{formatMillimes(c.amountMillimes, locale)}</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
