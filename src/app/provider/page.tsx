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
  type CaseState,
  type ClaimType,
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

  const brand = (() => {
    try {
      return JSON.parse(user.org?.branding ?? "{}") as { color?: string; initials?: string };
    } catch {
      return {};
    }
  })();

  return (
    <AppShell user={user} locale={locale}>
      <div
        className="mb-6 flex items-center gap-3 rounded-xl p-4 text-white"
        style={{ background: brand.color ?? "#0B6BB2" }}
      >
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/20 text-sm font-black">
          {brand.initials ?? "?"}
        </span>
        <div>
          <div className="text-xs uppercase tracking-wide opacity-80">
            {isAr ? "مكتب المزوّد (Guichet)" : "Guichet fournisseur"}
          </div>
          <div className="font-bold">{isAr && user.org?.nameAr ? user.org.nameAr : user.org?.name}</div>
        </div>
      </div>

      <PageTitle
        title={isAr ? "قائمة المطالب" : "File d'attente des réclamations"}
        subtitle={isAr ? "مرتّبة حسب أقرب أجل (SLA)." : "Triées par échéance SLA la plus proche."}
      />

      {cases.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted">
          {isAr ? "لا توجد مطالب واردة." : "Aucune réclamation reçue."}
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const business = isAr && c.claimantUser.org?.nameAr ? c.claimantUser.org.nameAr : c.claimantUser.org?.name;
            const state = c.state as CaseState;
            return (
              <Link key={c.id} href={`/provider/cases/${c.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:shadow-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{c.caseNumber}</span>
                      <Badge tone={stateTone(state)}>{STATE_LABEL[state][locale]}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {CLAIM_TYPE_LABEL[c.claimType as ClaimType][locale]} · {business} · {c.evidence.length}{" "}
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
