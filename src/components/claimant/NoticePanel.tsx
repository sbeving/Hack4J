import { Card, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { SlaCountdown } from "@/components/SlaCountdown";
import { generateNoticeAction, sendNoticeAction } from "@/lib/domain/notice-actions";
import type { CaseState, Locale } from "@/lib/domain/constants";

type NoticeLite = {
  id: string;
  status: string;
  version: number;
  sentAt: Date | null;
  deadlineDays: number;
};

const SLA_STATES: CaseState[] = ["notice_sent", "provider_review", "resolution_proposed"];

export function NoticePanel({
  caseId,
  state,
  notices,
  slaDueAtISO,
  serverNowISO,
  locale,
}: {
  caseId: string;
  state: CaseState;
  notices: NoticeLite[];
  slaDueAtISO: string | null;
  serverNowISO: string;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const sent = notices.find((n) => n.status === "sent");
  const generated = notices.find((n) => n.status === "generated");

  const L = {
    title: isAr ? "الإنذار الرسمي (Mise en demeure)" : "Mise en demeure",
    generate: isAr ? "توليد الإنذار الرسمي" : "Générer la mise en demeure",
    generating: isAr ? "جارٍ التوليد (PDF)…" : "Génération du PDF…",
    preview: isAr ? "معاينة PDF" : "Aperçu PDF",
    send: isAr ? "إرسال الإنذار" : "Envoyer la mise en demeure",
    sending: isAr ? "جارٍ الإرسال…" : "Envoi…",
    ready: isAr ? "الإنذار جاهز — راجعه ثم أرسله." : "Notice prête — vérifiez puis envoyez.",
    hint: isAr
      ? "يبدأ عدّاد الأجل (SLA) عند قبول التسليم."
      : "Le compteur SLA démarre à l'acceptation de la livraison.",
    sentOn: isAr ? "أُرسِل" : "Envoyée",
    download: isAr ? "تحميل الإنذار (PDF)" : "Télécharger (PDF)",
    simulated: isAr ? "تسليم محاكى" : "livraison simulée",
    deadline: isAr ? "أجل" : "délai",
    days: isAr ? "يوم" : "jours",
  };

  const pdfHref = (id: string) => `/api/notices/${id}/pdf`;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{L.title}</h3>
        {slaDueAtISO && SLA_STATES.includes(state) ? (
          <SlaCountdown dueAtISO={slaDueAtISO} serverNowISO={serverNowISO} locale={locale} />
        ) : null}
      </div>

      {sent ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {L.sentOn} · v{sent.version}
              </span>
              <Badge tone="warning">{L.simulated}</Badge>
            </div>
            <div className="text-xs text-muted">
              {sent.sentAt
                ? new Date(sent.sentAt).toLocaleString(isAr ? "ar-TN" : "fr-TN")
                : ""}{" "}
              · {L.deadline} {sent.deadlineDays} {L.days} · COC 268-274 / 278
            </div>
          </div>
          <a
            href={pdfHref(sent.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            📄 {L.download}
          </a>
        </div>
      ) : generated ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">{L.ready}</p>
          <div className="flex items-center gap-2">
            <a
              href={pdfHref(generated.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              📄 {L.preview}
            </a>
            <form action={sendNoticeAction.bind(null, caseId, generated.id)}>
              <SubmitButton pendingLabel={L.sending}>{L.send}</SubmitButton>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{L.hint}</p>
          <form action={generateNoticeAction.bind(null, caseId)}>
            <SubmitButton pendingLabel={L.generating}>{L.generate}</SubmitButton>
          </form>
        </div>
      )}
    </Card>
  );
}
