"use client";

import { useState } from "react";
import {
  acceptCaseAction,
  scheduleMediationAction,
  publishTermsAction,
  recordSettlementAction,
  closeUnsettledAction,
} from "@/lib/domain/resolver-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Button } from "@/components/ui";
import { REMEDY_LABEL, type CaseState, type Locale, type RequestedRemedy } from "@/lib/domain/constants";

const REMEDIES = Object.keys(REMEDY_LABEL) as RequestedRemedy[];

export function ResolverActions({
  caseId,
  state,
  currentSettlementId,
  bothAcknowledged,
  locale,
}: {
  caseId: string;
  state: CaseState;
  currentSettlementId: string | null;
  bothAcknowledged: boolean;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const [showClose, setShowClose] = useState(false);

  const L = {
    accept: isAr ? "قبول الملفّ (بدء الوساطة)" : "Accepter le dossier (ouvrir la médiation)",
    schedule: isAr ? "تحديد موعد الوساطة" : "Programmer la médiation",
    publish: isAr ? "نشر شروط التسوية" : "Publier les termes de règlement",
    obligations: isAr ? "الالتزامات / الشروط" : "Obligations / termes de l'accord",
    remedy: isAr ? "نوع الحل" : "Type de réparation",
    amount: isAr ? "المبلغ (د.ت)" : "Montant (TND)",
    perf: isAr ? "أجل التنفيذ" : "Échéance d'exécution",
    record: isAr ? "تسجيل التسوية (PV)" : "Enregistrer le règlement (PV)",
    close: isAr ? "إغلاق دون اتفاق" : "Clôturer sans accord",
    reason: isAr ? "السبب" : "Motif",
    confirm: isAr ? "تأكيد" : "Confirmer",
    ackNote: isAr
      ? "يُفضّل أن يُقرّ الطرفان بالشروط قبل التسجيل."
      : "Idéalement, les deux parties accusent réception avant l'enregistrement.",
  };

  const field = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm";

  if (state === "dossier_filed") {
    return (
      <form action={acceptCaseAction.bind(null, caseId)}>
        <SubmitButton pendingLabel={isAr ? "…" : "…"}>{L.accept}</SubmitButton>
      </form>
    );
  }

  if (state === "in_mediation") {
    return (
      <div className="space-y-4">
        <form action={scheduleMediationAction.bind(null, caseId)} className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">{L.schedule}</span>
            <input type="datetime-local" name="scheduledAt" required className={field} />
          </label>
          <SubmitButton variant="outline">{L.schedule}</SubmitButton>
        </form>

        <form action={publishTermsAction.bind(null, caseId)} className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">{L.obligations}</span>
            <textarea name="obligations" required rows={3} className={field} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">{L.remedy}</span>
              <select name="remedyType" defaultValue="correct_bill" className={field}>
                {REMEDIES.map((r) => (
                  <option key={r} value={r}>{REMEDY_LABEL[r][locale]}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">{L.amount}</span>
              <input name="amountTnd" type="number" step="0.001" min="0" className={field} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">{L.perf}</span>
              <input name="performanceDate" type="date" className={field} />
            </label>
          </div>
          <SubmitButton>{L.publish}</SubmitButton>
        </form>

        <CloseForm caseId={caseId} show={showClose} setShow={setShowClose} L={L} field={field} />
      </div>
    );
  }

  if (state === "settlement_pending" && currentSettlementId) {
    return (
      <div className="space-y-3">
        {!bothAcknowledged ? <p className="text-xs text-amber-700">{L.ackNote}</p> : null}
        <form action={recordSettlementAction.bind(null, caseId, currentSettlementId)}>
          <SubmitButton pendingLabel={isAr ? "توليد PV…" : "Génération du PV…"}>{L.record}</SubmitButton>
        </form>
        <CloseForm caseId={caseId} show={showClose} setShow={setShowClose} L={L} field={field} />
      </div>
    );
  }

  return null;
}

function CloseForm({
  caseId,
  show,
  setShow,
  L,
  field,
}: {
  caseId: string;
  show: boolean;
  setShow: (v: boolean) => void;
  L: Record<string, string>;
  field: string;
}) {
  return (
    <div>
      <Button variant="ghost" onClick={() => setShow(!show)} className="text-rose-600">
        {L.close}
      </Button>
      {show ? (
        <form action={closeUnsettledAction.bind(null, caseId)} className="mt-2 space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <input name="reason" placeholder={L.reason} className={field} />
          <SubmitButton variant="danger">{L.confirm}</SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
