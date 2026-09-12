import { requireRole, getLocale } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card } from "@/components/ui";

export default async function InstitutionHome() {
  const user = await requireRole("resolver");
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <AppShell user={user} locale={locale}>
      <PageTitle
        title={isAr ? "الملفات المصعّدة" : "Dossiers escaladés"}
        subtitle={
          isAr
            ? "استقبل الملفات، تحقّق من الأدلة، وأدر الوساطة."
            : "Recevez les dossiers, vérifiez les preuves, menez la médiation."
        }
      />
      <Card className="p-12 text-center">
        <div className="text-4xl">⚖️</div>
        <p className="mt-3 font-semibold">
          {isAr ? "لا يوجد ملف مصعّد" : "Aucun dossier escaladé"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {isAr
            ? "تصل الملفات هنا عند تجاوز الأجل أو رفض المزوّد."
            : "Les dossiers arrivent en cas de dépassement du SLA ou de refus du fournisseur."}
        </p>
      </Card>
    </AppShell>
  );
}
