import Link from "next/link";
import { requireSession, getLocale } from "@/lib/session";
import { getNotifications } from "@/lib/domain/notifications";
import { markAllReadAction } from "@/lib/domain/notification-actions";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Card } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ROLE_HOME, type Locale } from "@/lib/domain/constants";

const NOTIF_LABEL: Record<string, { fr: string; ar: string }> = {
  notice_received: { fr: "Nouvelle mise en demeure reçue", ar: "تم استلام إنذار جديد" },
  notice_sent: { fr: "Mise en demeure envoyée", ar: "تم إرسال الإنذار" },
  provider_acknowledged: { fr: "Le fournisseur a accusé réception", ar: "أقرّ المزوّد بالاستلام" },
  provider_requested_info: { fr: "Le fournisseur demande une information", ar: "يطلب المزوّد معلومة" },
  provider_contested: { fr: "Le fournisseur a contesté", ar: "اعترض المزوّد" },
  remedy_proposed: { fr: "Une résolution vous est proposée", ar: "تم اقتراح حل عليك" },
  remedy_accepted: { fr: "Le client a accepté la résolution", ar: "قبل العميل الحل" },
  remedy_declined: { fr: "Le client a refusé la résolution", ar: "رفض العميل الحل" },
  dossier_received: { fr: "Nouveau dossier escaladé", ar: "ملفّ مصعّد جديد" },
  case_accepted: { fr: "Le médiateur a accepté le dossier", ar: "قبل الوسيط الملفّ" },
  mediation_scheduled: { fr: "Médiation programmée", ar: "تمت برمجة الوساطة" },
  settlement_proposed: { fr: "Termes de règlement publiés", ar: "تم نشر شروط التسوية" },
  settled: { fr: "Litige réglé à l'amiable", ar: "تمت تسوية النزاع ودّيًا" },
  closed_unsettled: { fr: "Clôturé sans accord", ar: "أُغلق دون اتفاق" },
};

function casePath(role: string, caseId: string): string {
  if (role === "claimant") return `/claimant/cases/${caseId}`;
  if (role === "provider_agent") return `/provider/cases/${caseId}`;
  if (role === "resolver") return `/institution/cases/${caseId}`;
  return ROLE_HOME[role as keyof typeof ROLE_HOME] ?? "/";
}

export default async function NotificationsPage() {
  const user = await requireSession();
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const notifs = await getNotifications(user.id);

  return (
    <AppShell user={user} locale={locale}>
      <div className="flex items-center justify-between">
        <PageTitle title={isAr ? "الإشعارات" : "Notifications"} />
        {notifs.some((n) => !n.readAt) ? (
          <form action={markAllReadAction}>
            <SubmitButton variant="outline">{isAr ? "تحديد الكل كمقروء" : "Tout marquer lu"}</SubmitButton>
          </form>
        ) : null}
      </div>

      {notifs.length === 0 ? (
        <Card className="p-12 text-center text-sm text-ink-muted">
          {isAr ? "لا توجد إشعارات." : "Aucune notification."}
        </Card>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            let caseNumber = "";
            try {
              caseNumber = (JSON.parse(n.params ?? "{}") as { caseNumber?: string }).caseNumber ?? "";
            } catch {
              /* ignore */
            }
            const text = NOTIF_LABEL[n.type]?.[locale] ?? n.type;
            return (
              <Link key={n.id} href={n.caseId ? casePath(user.role, n.caseId) : "#"} className="block">
                <Card className={`flex items-center justify-between gap-3 p-4 transition ${n.readAt ? "opacity-70" : ""}`}>
                  <div className="flex items-center gap-3">
                    {!n.readAt ? <span className="dot h-2 w-2 shrink-0 rounded-full bg-primary" /> : <span className="h-2 w-2" />}
                    <div>
                      <div className={`text-sm text-ink ${n.readAt ? "" : "font-semibold"}`}>{text}</div>
                      {caseNumber ? <div className="text-xs text-ink-muted">{caseNumber}</div> : null}
                    </div>
                  </div>
                  <div className="text-xs text-ink-muted">
                    {new Date(n.createdAt).toLocaleString(isAr ? "ar-TN" : "fr-TN")}
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
