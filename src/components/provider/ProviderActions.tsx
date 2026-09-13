"use client";

import { useEffect, useRef, useState } from "react";
import {
  acknowledgeAction,
  requestInfoAction,
  contestAction,
  proposeRemedyAction,
  confirmResolutionAction,
} from "@/lib/domain/provider-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Button } from "@/components/ui";
import { REMEDY_LABEL, type CaseState, type Locale, type RequestedRemedy } from "@/lib/domain/constants";

const REMEDIES = Object.keys(REMEDY_LABEL) as RequestedRemedy[];

type Panel = "info" | "contest" | "remedy" | null;

export function ProviderActions({
  caseId,
  state,
  suggestedRemedyType,
  suggestedAmountTnd,
  locale,
}: {
  caseId: string;
  state: CaseState;
  suggestedRemedyType: string;
  suggestedAmountTnd: number;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const [panel, setPanel] = useState<Panel>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // The AI mediator card's "Utiliser ce compromis" button opens the remedy panel
  // (which is already pre-filled with the suggested compromise via props).
  useEffect(() => {
    const open = () => {
      setPanel("remedy");
      requestAnimationFrame(() =>
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
    };
    window.addEventListener("sulha:open-remedy", open);
    return () => window.removeEventListener("sulha:open-remedy", open);
  }, []);

  if (state === "resolution_proposed") {
    return (
      <div className="rounded-lg bg-warning-tint p-4 text-sm text-warning-deep">
        {isAr
          ? "تم اقتراح حل — في انتظار قبول/رفض العميل."
          : "Résolution proposée — en attente de l'acceptation du client."}
      </div>
    );
  }
  if (state === "resolution_agreed") {
    return (
      <div className="space-y-3 rounded-lg border border-cobalt/25 bg-cobalt-tint p-4">
        <p className="text-sm text-cobalt">
          {isAr
            ? "أكّد المشتكي الحل المقترح. أكّد بدورك لإغلاق الملف كـ «مسوًّى» (اتفاق مباشر) — يتطلّب تأكيد الطرفين."
            : "Le réclamant a confirmé la résolution proposée. Confirmez à votre tour pour clôturer en « Réglé » (accord direct) — l'accord des deux parties est requis."}
        </p>
        <form action={confirmResolutionAction.bind(null, caseId)}>
          <SubmitButton pendingLabel={isAr ? "تأكيد…" : "Confirmation…"}>
            {isAr ? "تأكيد الحل" : "Confirmer la résolution"}
          </SubmitButton>
        </form>
      </div>
    );
  }
  if (state === "filed") {
    return (
      <div className="rounded-lg bg-primary-tint p-4 text-sm text-ink">
        {isAr
          ? "تم إيداع المطلب — في انتظار إرسال الإنذار الرسمي من المشتكي."
          : "Réclamation déposée — en attente de la mise en demeure du réclamant."}
      </div>
    );
  }
  if (!["notice_sent", "provider_review"].includes(state)) {
    return (
      <div className="rounded-lg bg-surface-sand p-4 text-sm text-ink-muted">
        {isAr ? "لا يوجد إجراء متاح في هذه الحالة." : "Aucune action disponible dans cet état."}
      </div>
    );
  }

  const L = {
    ack: isAr ? "الإقرار بالاستلام" : "Accuser réception",
    info: isAr ? "طلب معلومة" : "Demander une info",
    contest: isAr ? "الاعتراض" : "Contester",
    remedy: isAr ? "اقتراح حل" : "Proposer une résolution",
    send: isAr ? "إرسال" : "Envoyer",
    msg: isAr ? "الرسالة" : "Message",
    type: isAr ? "نوع الحل" : "Type de résolution",
    amount: isAr ? "المبلغ (د.ت)" : "Montant (TND)",
    cancel: isAr ? "إلغاء" : "Annuler",
  };

  return (
    <div className="space-y-3" ref={rootRef}>
      <div className="flex flex-wrap gap-2">
        <form action={acknowledgeAction.bind(null, caseId)}>
          <SubmitButton variant="outline">{L.ack}</SubmitButton>
        </form>
        <Button variant="outline" onClick={() => setPanel(panel === "info" ? null : "info")}>
          {L.info}
        </Button>
        <Button variant="outline" onClick={() => setPanel(panel === "contest" ? null : "contest")}>
          {L.contest}
        </Button>
        <Button onClick={() => setPanel(panel === "remedy" ? null : "remedy")}>{L.remedy}</Button>
      </div>

      {panel === "info" ? (
        <form action={requestInfoAction.bind(null, caseId)} className="space-y-2 rounded-lg border border-border p-3">
          <textarea name="message" required rows={2} placeholder={L.msg}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <SubmitButton variant="outline">{L.send}</SubmitButton>
        </form>
      ) : null}

      {panel === "contest" ? (
        <form action={contestAction.bind(null, caseId)} className="space-y-2 rounded-lg border border-border bg-danger-tint p-3">
          <textarea name="message" required rows={2} placeholder={L.msg}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          <SubmitButton variant="danger">{L.contest}</SubmitButton>
        </form>
      ) : null}

      {panel === "remedy" ? (
        <form action={proposeRemedyAction.bind(null, caseId)} className="space-y-3 rounded-lg border border-border bg-success-tint p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">{L.type}</span>
              <select name="remedyType" defaultValue={REMEDIES.includes(suggestedRemedyType as RequestedRemedy) ? suggestedRemedyType : "correct_bill"}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                {REMEDIES.map((r) => (
                  <option key={r} value={r}>{REMEDY_LABEL[r][locale]}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">{L.amount}</span>
              <input name="amountTnd" type="number" step="0.001" min="0" defaultValue={suggestedAmountTnd || ""}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" />
            </label>
          </div>
          <textarea name="message" rows={2} placeholder={L.msg}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
          <SubmitButton>{L.send}</SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
