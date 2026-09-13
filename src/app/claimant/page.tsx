import Link from "next/link";
import { requireRole, getLocale } from "@/lib/session";
import { getClaimantCases } from "@/lib/domain/cases";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card, Badge } from "@/components/ui";
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
  if (s === "draft") return "neutral" as const;
  return "brand" as const;
}

export default async function ClaimantHome() {
  const user = await requireRole("claimant");
  const locale = await getLocale();
  const isAr = locale === "ar";
  const cases = await getClaimantCases(user.id);

  return (
    <AppShell user={user} locale={locale}>
      <PageTitle
        icon="document"
        title={isAr ? "مطالبي" : "Mes réclamations"}
        subtitle={isAr ? "تابع مطالبك مثل تتبّع طرد بريدي." : "Suivez vos réclamations comme un colis."}
      />

      {cases.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-muted">
          {isAr ? "لا يوجد أي مطلب بعد." : "Aucune réclamation pour le moment."}
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const provider = isAr && c.providerOrg.nameAr ? c.providerOrg.nameAr : c.providerOrg.name;
            return (
              <Link key={c.id} href={`/claimant/cases/${c.id}`} className="block">
                <Card className="flex items-center justify-between gap-4 p-4 transition hover:border-border-strong">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{c.caseNumber}</span>
                      <Badge tone={stateTone(c.state as CaseState)}>
                        {label(STATE_LABEL, c.state, locale)}
                      </Badge>
                    </div>
                    <div className="mt-1 truncate text-sm text-ink-muted">
                      {label(CLAIM_TYPE_LABEL, c.claimType, locale)} · {provider} · {c.evidence.length}{" "}
                      {isAr ? "دليل" : "preuve(s)"}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-semibold">{formatMillimes(c.amountMillimes, locale)}</div>
                    <div className="text-xs text-ink-muted">
                      {new Date(c.updatedAt).toLocaleDateString(isAr ? "ar-TN" : "fr-TN")}
                    </div>
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
