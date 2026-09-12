"use client";

import { useRef, useState } from "react";
import { createClaimAction } from "@/lib/domain/claim-actions";
import { SubmitButton } from "@/components/SubmitButton";
import {
  CLAIM_TYPES,
  CLAIM_TYPE_LABEL,
  REMEDY_LABEL,
  type Locale,
  type RequestedRemedy,
} from "@/lib/domain/constants";

type Provider = { id: string; name: string; nameAr: string | null };

const REMEDIES = Object.keys(REMEDY_LABEL) as RequestedRemedy[];

export function NewClaimForm({
  providers,
  locale,
}: {
  providers: Provider[];
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const [narrative, setNarrative] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);

  const L = {
    provider: isAr ? "المزوّد المعني" : "Fournisseur concerné",
    pick: isAr ? "— اختر —" : "— Choisir —",
    type: isAr ? "نوع النزاع" : "Type de litige",
    auto: isAr ? "🔎 كشف تلقائي (بالذكاء الاصطناعي)" : "🔎 Détection automatique (IA)",
    narrative: isAr ? "صف المشكلة (بالعربية / الدارجة / الفرنسية)" : "Décrivez le problème (arabe / derja / français)",
    voice: isAr ? "🎤 إملاء صوتي" : "🎤 Dicter",
    stop: isAr ? "■ إيقاف" : "■ Arrêter",
    amount: isAr ? "المبلغ المتنازع عليه (د.ت)" : "Montant contesté (TND)",
    reference: isAr ? "المرجع (رقم العقد/الفاتورة)" : "Référence (n° contrat/facture)",
    remedy: isAr ? "الحل المطلوب" : "Réparation demandée",
    submit: isAr ? "إنشاء المطلب" : "Créer la réclamation",
    submitting: isAr ? "جارٍ التحليل بالذكاء الاصطناعي…" : "Analyse IA en cours…",
    hint: isAr
      ? "سيصنّف الذكاء الاصطناعي المطلب ويوجّهه إلى المكتب المناسب."
      : "L'IA classe la réclamation et la route vers le bon guichet.",
  };

  function toggleVoice() {
    type SR = new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (e: {
        resultIndex: number;
        results: { isFinal: boolean; 0: { transcript: string } }[];
      }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    const w = window as unknown as { webkitSpeechRecognition?: SR; SpeechRecognition?: SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      alert(
        isAr
          ? "الإدخال الصوتي غير مدعوم في هذا المتصفح — يرجى الكتابة."
          : "La saisie vocale n'est pas supportée par ce navigateur — veuillez écrire."
      );
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = "ar-TN";
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) setNarrative((n) => (n ? n + " " : "") + final.trim());
    };
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  return (
    <form action={createClaimAction} className="card space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{L.provider}</span>
          <select
            name="providerOrgId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              {L.pick}
            </option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {isAr && p.nameAr ? p.nameAr : p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{L.type}</span>
          <select
            name="claimType"
            defaultValue="auto"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="auto">{L.auto}</option>
            {CLAIM_TYPES.map((ct) => (
              <option key={ct} value={ct}>
                {CLAIM_TYPE_LABEL[ct][locale]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold">{L.narrative}</span>
          <button
            type="button"
            onClick={toggleVoice}
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              listening
                ? "bg-rose-600 text-white animate-pulse"
                : "border border-border hover:bg-slate-50"
            }`}
          >
            {listening ? L.stop : L.voice}
          </button>
        </div>
        <textarea
          name="narrative"
          required
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={5}
          dir="auto"
          placeholder={isAr ? "مثال: STEG فوترتني 900 دينار زيادة هذا الشهر…" : "Ex : STEG m'a facturé 900 dinars de trop ce mois-ci…"}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{L.amount}</span>
          <input
            name="amountTnd"
            type="number"
            step="0.001"
            min="0"
            placeholder="900.000"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{L.reference}</span>
          <input
            name="reference"
            type="text"
            placeholder="STEG-000-0000"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{L.remedy}</span>
          <select
            name="requestedRemedy"
            defaultValue="correct_bill"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          >
            {REMEDIES.map((r) => (
              <option key={r} value={r}>
                {REMEDY_LABEL[r][locale]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted">{L.hint}</p>
        <SubmitButton pendingLabel={L.submitting}>{L.submit}</SubmitButton>
      </div>
    </form>
  );
}
