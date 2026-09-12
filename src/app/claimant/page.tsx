import Link from "next/link";
import { requireRole, getLocale } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card } from "@/components/ui";

export default async function ClaimantHome() {
  const user = await requireRole("claimant");
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <AppShell user={user} locale={locale}>
      <div className="flex items-center justify-between">
        <PageTitle
          title={isAr ? "مطالبي" : "Mes réclamations"}
          subtitle={
            isAr
              ? "تابع مطالبك مثل تتبّع طرد بريدي."
              : "Suivez vos réclamations comme un colis."
          }
        />
        <Link
          href="/claimant/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink"
        >
          + {isAr ? "مطلب جديد" : "Nouvelle réclamation"}
        </Link>
      </div>

      <Card className="mt-4 p-12 text-center">
        <div className="text-4xl">📄</div>
        <p className="mt-3 font-semibold">
          {isAr ? "لا يوجد أي مطلب بعد" : "Aucune réclamation pour le moment"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {isAr
            ? "ابدأ بإيداع مطلب ضد مزوّد الخدمة."
            : "Commencez par déposer une réclamation contre un fournisseur."}
        </p>
      </Card>
    </AppShell>
  );
}
