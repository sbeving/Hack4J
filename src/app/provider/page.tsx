import { requireRole, getLocale } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card } from "@/components/ui";

export default async function ProviderHome() {
  const user = await requireRole("provider_agent");
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <AppShell user={user} locale={locale}>
      <PageTitle
        title={isAr ? "قائمة المطالب" : "File d'attente des réclamations"}
        subtitle={
          isAr
            ? "المطالب الموجّهة إلى مكتبك مع مؤقّت الآجال."
            : "Les réclamations routées vers votre guichet, avec minuteur SLA."
        }
      />
      <Card className="p-12 text-center">
        <div className="text-4xl">📥</div>
        <p className="mt-3 font-semibold">
          {isAr ? "لا توجد مطالب واردة" : "Aucune réclamation reçue"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {isAr
            ? "ستظهر هنا المطالب بعد إرسال الإنذار وقبول التسليم."
            : "Les réclamations apparaîtront après l'envoi de la mise en demeure."}
        </p>
      </Card>
    </AppShell>
  );
}
