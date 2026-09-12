import Link from "next/link";
import { requireRole, getLocale } from "@/lib/session";
import { getResolverQueue } from "@/lib/domain/resolver";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card, Badge } from "@/components/ui";
import { formatMillimes } from "@/lib/money";
import { CLAIM_TYPE_LABEL, STATE_LABEL, label, type CaseState } from "@/lib/domain/constants";

function stateTone(s: CaseState) {
  if (s === "settled") return "success" as const;
  if (s === "closed_unsettled") return "danger" as const;
  if (s === "dossier_filed") return "warning" as const;
  return "brand" as const;
}

export default async function InstitutionHome() {
  const user = await requireRole("resolver");
  const locale = await getLocale();
  const isAr = locale === "ar";
  const cases = await getResolverQueue(user.orgId ?? "");

  return (
    <AppShell user={user} locale={locale}>
      <PageTitle
        icon="scales"
        title={isAr ? "الملفّات المصعّدة" : "Dossiers escaladés"}
        subtitle={isAr ? "تحقّق من الأدلة وأدر الوساطة." : "Vérifiez les preuves et menez la médiation."}
      />

      {cases.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-muted">
          {isAr ? "لا يوجد ملفّ مصعّد." : "Aucun dossier escaladé."}
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const business = isAr && c.claimantUser.org?.nameAr ? c.claimantUser.org.nameAr : c.claimantUser.org?.name;
            const state = c.state as CaseState;
            return (
              <Link key={c.id} href={`/institution/cases/${c.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:border-border-strong">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{c.caseNumber}</span>
                      <Badge tone={stateTone(state)}>{label(STATE_LABEL, c.state, locale)}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-ink-muted">
                      {label(CLAIM_TYPE_LABEL, c.claimType, locale)} · {business} → {c.providerOrg.name}
                    </div>
                  </div>
                  <div className="text-end font-semibold">{formatMillimes(c.amountMillimes, locale)}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
