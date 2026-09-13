import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/domain/constants";

type Ev = { id: string; sequence: number; type: string; actor: string | null; ts: Date };
type Anchor = {
  subjectId: string;
  subjectType: string;
  txHash: string | null;
  blockNumber: number | null;
  status: string;
  adapter: string;
};

const EVENT_LABEL: Record<string, { fr: string; ar: string }> = {
  created: { fr: "Réclamation créée", ar: "إنشاء المطلب" },
  filed: { fr: "Réclamation déposée", ar: "إيداع المطلب" },
  evidence_added: { fr: "Preuve ajoutée", ar: "إضافة دليل" },
  evidence_confirmed: { fr: "Preuve confirmée", ar: "تأكيد دليل" },
  evidence_removed: { fr: "Preuve supprimée", ar: "حذف دليل" },
  notice_generated: { fr: "Mise en demeure générée", ar: "توليد الإنذار" },
  notice_sent: { fr: "Mise en demeure envoyée", ar: "إرسال الإنذار" },
  sla_started: { fr: "Compteur SLA démarré", ar: "بدء عدّاد الأجل" },
  provider_acknowledged: { fr: "Accusé de réception (fournisseur)", ar: "إقرار المزوّد" },
  provider_requested_info: { fr: "Demande d'information", ar: "طلب معلومة" },
  provider_contested: { fr: "Contestation du fournisseur", ar: "اعتراض المزوّد" },
  provider_proposed_remedy: { fr: "Résolution proposée", ar: "اقتراح حل" },
  claimant_accepted_remedy: { fr: "Résolution acceptée", ar: "قبول الحل" },
  claimant_declined_remedy: { fr: "Résolution refusée", ar: "رفض الحل" },
  escalation_requested: { fr: "Escalade demandée", ar: "طلب التصعيد" },
  dossier_filed: { fr: "Dossier transmis", ar: "إرسال الملفّ" },
  resolver_accepted: { fr: "Dossier accepté (médiateur)", ar: "قبول الوسيط" },
  mediation_scheduled: { fr: "Médiation programmée", ar: "برمجة الوساطة" },
  settlement_terms_published: { fr: "Termes de règlement publiés", ar: "نشر شروط التسوية" },
  terms_acknowledged: { fr: "Accusé des termes", ar: "الإقرار بالشروط" },
  settlement_recorded: { fr: "Règlement enregistré (PV)", ar: "تسجيل التسوية" },
  closed_unsettled: { fr: "Clôturé sans accord", ar: "إغلاق دون اتفاق" },
  withdrawn: { fr: "Réclamation retirée", ar: "سحب المطلب" },
};

function eventLabel(type: string, locale: Locale) {
  return EVENT_LABEL[type]?.[locale] ?? type;
}

export function AuditTimeline({
  events,
  anchors,
  locale,
}: {
  events: Ev[];
  anchors: Anchor[];
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const byEvent = new Map(anchors.filter((a) => a.subjectType === "event").map((a) => [a.subjectId, a]));
  const adapter = anchors[0]?.adapter ?? "memory";

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-semibold text-ink">
          {isAr ? "سجلّ التدقيق (على السلسلة)" : "Registre d'audit (on-chain)"}
        </h3>
        <Badge tone={adapter === "anvil" ? "success" : "neutral"}>
          {adapter === "anvil" ? "Anvil" : isAr ? "سلسلة محلّية (محاكاة)" : "registre local (simulation)"}
        </Badge>
      </div>

      <ol className="relative space-y-3 ps-4">
        {events.map((e) => {
          const a = byEvent.get(e.id);
          return (
            <li key={e.id} className="relative">
              <span className="absolute -start-4 top-1 grid h-3 w-3 place-items-center">
                <span className="dot h-2 w-2 rounded-full bg-primary" />
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-ink">{eventLabel(e.type, locale)}</div>
                  <div className="text-xs text-ink-muted">
                    #{e.sequence} · {new Date(e.ts).toLocaleString(isAr ? "ar-TN" : "fr-TN")}
                    {e.actor ? ` · ${e.actor}` : ""}
                  </div>
                </div>
                {a?.txHash ? (
                  <div className="text-end">
                    <div className="text-[10px] text-ink-muted">
                      tx {a.txHash.slice(0, 10)}…{a.txHash.slice(-6)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-success">
                      <Icon name="check" className="h-3 w-3" />
                      {isAr ? "مثبّت · كتلة" : "ancré · bloc"} {a.blockNumber}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-warning">{isAr ? "قيد التثبيت" : "ancrage en attente"}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
