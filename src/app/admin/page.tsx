import { requireRole, getLocale } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card } from "@/components/ui";

export default async function AdminHome() {
  const user = await requireRole("admin");
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <AppShell user={user} locale={locale}>
      <PageTitle
        title={isAr ? "الإشراف على الشبكة" : "Supervision du réseau"}
        subtitle={
          isAr
            ? "الحجم، آجال المعالجة، والمنفعة للمؤسسات."
            : "Volume, délais de traitement et bénéfice institutionnel."
        }
      />
      <Card className="p-12 text-center">
        <div className="text-4xl">📊</div>
        <p className="mt-3 font-semibold">
          {isAr ? "لا توجد بيانات بعد" : "Aucune donnée pour le moment"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {isAr
            ? "ستظهر مؤشّرات الأداء و«المنفعة للمؤسسة» هنا."
            : "Les indicateurs et « l'Agency Benefit » apparaîtront ici."}
        </p>
      </Card>
    </AppShell>
  );
}
