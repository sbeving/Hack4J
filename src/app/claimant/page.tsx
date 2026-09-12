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
      <div className="flex items-center justify-between">
        <PageTitle
          title={isAr ? "مطالبي" : "Mes réclamations"}
          subtitle={isAr ? "تابع مطالبك مثل تتبّع طرد بريدي." : "Suivez vos réclamations comme un colis."}
        />
        <Link
          href="/claimant/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink"
        >
          + {isAr ? "مطلب جديد" : "Nouvelle réclamation"}
        </Link>
      </div>

      {cases.length === 0 ? (
        <Card className="mt-4 p-12 text-center">
          <div className="text-4xl">📄</div>
          <p className="mt-3 font-semibold">
            {isAr ? "لا يوجد أي مطلب بعد" : "Aucune réclamation pour le moment"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {isAr ? "ابدأ بإيداع مطلب ضد مزوّد الخدمة." : "Commencez par déposer une réclamation contre un fournisseur."}
          </p>
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {cases.map((c) => {
            const provider = isAr && c.providerOrg.nameAr ? c.providerOrg.nameAr : c.providerOrg.name;
            return (
              <Link key={c.id} href={`/claimant/cases/${c.id}`} className="block">
                <Card className="flex items-center justify-between gap-4 p-4 transition hover:shadow-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{c.caseNumber}</span>
                      <Badge tone={stateTone(c.state as CaseState)}>
                        {label(STATE_LABEL, c.state, locale)}
                      </Badge>
                    </div>
                    <div className="mt-1 truncate text-sm text-muted">
                      {label(CLAIM_TYPE_LABEL, c.claimType, locale)} · {provider} · {c.evidence.length}{" "}
                      {isAr ? "دليل" : "preuve(s)"}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-semibold">{formatMillimes(c.amountMillimes, locale)}</div>
                    <div className="text-xs text-muted">
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
