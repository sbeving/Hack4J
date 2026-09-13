"use client";

import { useRef, useState } from "react";
import { createClaimAction } from "@/lib/domain/claim-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Input, Textarea, Select, Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import {
  CLAIM_TYPES,
  CLAIM_TYPE_LABEL,
  REMEDY_LABEL,
  type Locale,
  type RequestedRemedy,
} from "@/lib/domain/constants";

type Provider = { id: string; name: string; nameAr: string | null };

const REMEDIES = Object.keys(REMEDY_LABEL) as RequestedRemedy[];
const RECOG_LANGS = [
  { code: "ar-TN", label: "الدارجة" },
  { code: "ar-SA", label: "العربية" },
  { code: "fr-FR", label: "Français" },
];

export function NewClaimForm({ providers, locale }: { providers: Provider[]; locale: Locale }) {
  const isAr = locale === "ar";
  const [narrative, setNarrative] = useState("");
  const [listening, setListening] = useState(false);
  const [recogLang, setRecogLang] = useState(isAr ? "ar-TN" : "fr-FR");
  const recRef = useRef<{ stop: () => void } | null>(null);

  const L = {
    provider: isAr ? "المزوّد المعني" : "Fournisseur concerné",
    pick: isAr ? "— اختر —" : "— Choisir —",
    type: isAr ? "نوع النزاع" : "Type de litige",
    auto: isAr ? "Détection automatique (IA)" : "Détection automatique (IA)",
    narrative: isAr ? "صف المشكلة" : "Décrivez le problème",
    narrativeHint: isAr
      ? "بالدارجة أو العربية أو الفرنسية — بصوتك أو كتابةً."
      : "En derja, arabe ou français — à la voix ou au clavier.",
    voice: isAr ? "إملاء" : "Dicter",
    stop: isAr ? "إيقاف" : "Arrêter",
    amount: isAr ? "المبلغ المتنازع عليه (د.ت)" : "Montant contesté (TND)",
    reference: isAr ? "المرجع (رقم العقد/الفاتورة)" : "Référence (contrat / facture)",
    remedy: isAr ? "الحل المطلوب" : "Réparation demandée",
    submit: isAr ? "إنشاء المطلب" : "Créer la réclamation",
    submitting: isAr ? "تحليل بالذكاء الاصطناعي…" : "Analyse IA…",
    hint: isAr
      ? "يصنّف الذكاء الاصطناعي المطلب ويوجّهه إلى المكتب المناسب."
      : "L'IA classe la réclamation et la route vers le bon guichet.",
  };

  function toggleVoice() {
    type SR = new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    const w = window as unknown as { webkitSpeechRecognition?: SR; SpeechRecognition?: SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      alert(isAr ? "الإدخال الصوتي غير مدعوم — يرجى الكتابة." : "La saisie vocale n'est pas supportée — veuillez écrire.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = recogLang;
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
    <Card className="p-6">
      <form action={createClaimAction} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={L.provider}>
            <Select name="providerOrgId" required defaultValue="">
              <option value="" disabled>
                {L.pick}
              </option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {isAr && p.nameAr ? p.nameAr : p.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={L.type}>
            <Select name="claimType" defaultValue="auto">
              <option value="auto">{L.auto}</option>
              {CLAIM_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {CLAIM_TYPE_LABEL[ct][locale]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{L.narrative}</span>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <select
                  value={recogLang}
                  onChange={(e) => setRecogLang(e.target.value)}
                  aria-label="Langue de dictée"
                  className="rounded-lg border border-border bg-surface py-1 ps-2 pe-6 text-xs font-medium text-ink-muted focus:border-primary focus:outline-none"
                >
                  {RECOG_LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={toggleVoice}
                className={
                  listening
                    ? "inline-flex items-center gap-1.5 rounded-lg bg-seal px-3 py-1.5 text-xs font-semibold text-white"
                    : "inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-sand"
                }
              >
                <span className={listening ? "dot bg-white animate-pulse" : ""}>
                  {!listening ? <Icon name="mic" size={14} /> : null}
                </span>
                {listening ? L.stop : L.voice}
              </button>
            </div>
          </div>
          <Textarea
            name="narrative"
            required
            minLength={5}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={5}
            dir="auto"
            placeholder={
              isAr ? "مثال: STEG فوترتني 900 دينار زيادة هذا الشهر…" : "Ex : STEG m'a facturé 900 dinars de trop ce mois-ci…"
            }
          />
          <p className="mt-1 text-xs text-ink-muted">{L.narrativeHint}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={L.amount}>
            <Input name="amountTnd" type="number" step="0.001" min="0" placeholder="900.000" />
          </Field>
          <Field label={L.reference}>
            <Input name="reference" type="text" placeholder="STEG-0000-0000" />
          </Field>
          <Field label={L.remedy}>
            <Select name="requestedRemedy" defaultValue="correct_bill">
              {REMEDIES.map((r) => (
                <option key={r} value={r}>
                  {REMEDY_LABEL[r][locale]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <p className="inline-flex items-center gap-2 text-xs text-ink-muted">
            <Icon name="sparkle" size={15} className="text-primary" />
            {L.hint}
          </p>
          <SubmitButton pendingLabel={L.submitting}>{L.submit}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
