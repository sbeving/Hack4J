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
        style={{ background: brand.color ?? "#6D28D9" }}
      >
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/20 text-sm font-black">
          {brand.initials ?? "⚖️"}
        </span>
        <div>
          <div className="text-xs uppercase tracking-wide opacity-80">
            {isAr ? "الوحدة المؤسّسية المحايدة" : "Module institutionnel neutre"}
          </div>
          <div className="font-bold">{isAr && user.org?.nameAr ? user.org.nameAr : user.org?.name}</div>
        </div>
      </div>

      <PageTitle
        title={isAr ? "الملفّات المصعّدة" : "Dossiers escaladés"}
        subtitle={isAr ? "تحقّق من الأدلة وأدر الوساطة." : "Vérifiez les preuves et menez la médiation."}
      />

      {cases.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted">
          {isAr ? "لا يوجد ملفّ مصعّد." : "Aucun dossier escaladé."}
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const business = isAr && c.claimantUser.org?.nameAr ? c.claimantUser.org.nameAr : c.claimantUser.org?.name;
            const state = c.state as CaseState;
            return (
              <Link key={c.id} href={`/institution/cases/${c.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:shadow-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{c.caseNumber}</span>
                      <Badge tone={stateTone(state)}>{label(STATE_LABEL, c.state, locale)}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted">
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
