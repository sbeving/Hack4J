"use client";

import { useMemo, useRef, useState } from "react";
import { createClaimAction } from "@/lib/domain/claim-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Input, Textarea, Select, Card, cn } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { CLAIM_TYPE_LABEL, REMEDY_LABEL, type ClaimType, type Locale } from "@/lib/domain/constants";
import {
  claimTypesForProvider,
  intakeForContext,
  isClaimTypeAllowed,
} from "@/lib/domain/provider-intake";

type Provider = { id: string; name: string; nameAr: string | null; branding: string | null };

type Branding = { short?: string; color?: string; logo?: string; sector?: { fr: string; ar: string } };

/** Provider mark — real logo on a white tile, colored-acronym fallback. */
function LogoTile({ logo, short, color, size }: { logo?: string; short: string; color: string; size: "lg" | "sm" }) {
  const box = size === "lg" ? "h-12 w-12 rounded-xl" : "h-11 w-11 rounded-lg";
  if (logo) {
    return (
      <span className={cn("grid shrink-0 place-items-center overflow-hidden border border-border bg-white p-1.5", box)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={short} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      className={cn("grid shrink-0 place-items-center text-sm font-bold text-white", box)}
      style={{ backgroundColor: color }}
    >
      {short.length <= 5 ? short : short.slice(0, 4)}
    </span>
  );
}

const RECOG_LANGS = [
  { code: "ar-TN", label: "الدارجة" },
  { code: "ar-SA", label: "العربية" },
  { code: "fr-FR", label: "Français" },
];

function parseBranding(p: Provider): Branding {
  try {
    return p.branding ? (JSON.parse(p.branding) as Branding) : {};
  } catch {
    return {};
  }
}

/** Short label ("STEG") derived from branding, else the first token of the name. */
function shortOf(p: Provider, b: Branding): string {
  if (b.short) return b.short;
  return p.name.split(/[—-]/)[0].trim().split(/\s+/).slice(0, 2).join(" ");
}

export function NewClaimForm({ providers, locale }: { providers: Provider[]; locale: Locale }) {
  const isAr = locale === "ar";
  const [providerId, setProviderId] = useState("");
  const [query, setQuery] = useState("");
  const [claimType, setClaimType] = useState<ClaimType | "auto">("auto");
  const [narrative, setNarrative] = useState("");
  const [listening, setListening] = useState(false);
  const [recogLang, setRecogLang] = useState(isAr ? "ar-TN" : "fr-FR");
  const recRef = useRef<{ stop: () => void } | null>(null);

  const selected = providers.find((p) => p.id === providerId) ?? null;
  const selectedBranding = selected ? parseBranding(selected) : {};
  const allowedTypes = claimTypesForProvider(providerId);
  const intake = intakeForContext(providerId, claimType, locale);

  const L = {
    step1: isAr ? "الخطوة 1 من 2 — اختر المزوّد" : "Étape 1 sur 2 — Choisissez le fournisseur",
    step2: isAr ? "الخطوة 2 من 2 — تفاصيل النزاع" : "Étape 2 sur 2 — Détails du litige",
    searchPlaceholder: isAr ? "ابحث عن مؤسسة عمومية…" : "Rechercher une institution publique…",
    noResults: isAr ? "لا نتائج." : "Aucun résultat.",
    change: isAr ? "تغيير" : "Changer",
    provider: isAr ? "المزوّد المعني" : "Fournisseur concerné",
    type: isAr ? "نوع النزاع" : "Type de litige",
    auto: isAr ? "كشف تلقائي (ذكاء اصطناعي)" : "Détection automatique (IA)",
    dictLang: isAr ? "لغة الإملاء" : "Langue de dictée",
    narrative: isAr ? "صف المشكلة" : "Décrivez le problème",
    narrativeHint: isAr
      ? "بالدارجة أو العربية أو الفرنسية — بصوتك أو كتابةً."
      : "En derja, arabe ou français — à la voix ou au clavier.",
    voice: isAr ? "إملاء" : "Dicter",
    stop: isAr ? "إيقاف" : "Arrêter",
    remedy: isAr ? "الحل المطلوب" : "Réparation demandée",
    submit: isAr ? "إنشاء المطلب" : "Créer la réclamation",
    submitting: isAr ? "تحليل بالذكاء الاصطناعي…" : "Analyse IA…",
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) => {
      const b = parseBranding(p);
      return (
        p.name.toLowerCase().includes(q) ||
        (p.nameAr ?? "").includes(query.trim()) ||
        (b.short ?? "").toLowerCase().includes(q) ||
        (b.sector?.fr ?? "").toLowerCase().includes(q)
      );
    });
  }, [providers, query]);

  function pickProvider(id: string) {
    setProviderId(id);
    if (claimType !== "auto" && id && !isClaimTypeAllowed(id, claimType)) {
      setClaimType("auto");
    }
  }

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

  // ── Step 1: provider picker ────────────────────────────────────────────────
  if (!providerId) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <div className="text-sm font-semibold text-ink">{L.step1}</div>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-ink-muted">
              <Icon name="search" size={16} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={L.searchPlaceholder}
              dir="auto"
              aria-label={L.searchPlaceholder}
              className="w-full rounded-lg border border-border bg-surface py-2.5 ps-10 pe-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">{L.noResults}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((p) => {
              const b = parseBranding(p);
              const short = shortOf(p, b);
              const color = b.color ?? "#1e7a82";
              const name = isAr && p.nameAr ? p.nameAr : p.name;
              const sector = b.sector ? (isAr ? b.sector.ar : b.sector.fr) : "";
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickProvider(p.id)}
                  className="card-flat group flex flex-col items-start gap-3 p-4 text-start transition-colors hover:border-primary hover:bg-primary-tint/25"
                >
                  <LogoTile logo={b.logo} short={short} color={color} size="lg" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{short}</span>
                    {sector ? <span className="mt-0.5 block truncate text-xs text-ink-muted">{sector}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    );
  }

  // ── Step 2: claim form ─────────────────────────────────────────────────────
  const detailCols = intake.showAmount ? "sm:grid-cols-3" : "sm:grid-cols-2";
  const formKey = `${providerId}-${claimType}`;
  const selShort = selected ? shortOf(selected, selectedBranding) : "";
  const selColor = selectedBranding.color ?? "#1e7a82";
  const selSector = selectedBranding.sector ? (isAr ? selectedBranding.sector.ar : selectedBranding.sector.fr) : "";

  return (
    <Card className="p-6">
      {/* Chosen provider header + change */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-surface-sand/60 p-3">
        <LogoTile logo={selectedBranding.logo} short={selShort} color={selColor} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-ink-muted">{L.provider}</div>
          <div className="truncate font-semibold text-ink">{selShort}</div>
          {selSector ? <div className="truncate text-xs text-ink-muted">{selSector}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => setProviderId("")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-sand"
        >
          <Icon name="arrow" size={14} className="rtl:-scale-x-100" />
          {L.change}
        </button>
      </div>

      <div className="mb-4 text-sm font-semibold text-ink">{L.step2}</div>

      <form action={createClaimAction} className="space-y-6">
        <input type="hidden" name="providerOrgId" value={providerId} />

        <Field label={L.type}>
          <Select
            name="claimType"
            value={claimType}
            onChange={(e) => setClaimType(e.target.value as ClaimType | "auto")}
          >
            <option value="auto">{L.auto}</option>
            {allowedTypes.map((ct) => (
              <option key={ct} value={ct}>
                {CLAIM_TYPE_LABEL[ct][locale]}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{L.narrative}</span>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <select
                  value={recogLang}
                  onChange={(e) => setRecogLang(e.target.value)}
                  aria-label={L.dictLang}
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
                aria-pressed={listening}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  listening
                    ? "border-seal/40 bg-surface text-seal-deep"
                    : "border-border-strong bg-surface text-ink hover:bg-surface-sand"
                )}
              >
                {listening ? <span className="dot bg-seal animate-pulse" /> : <Icon name="mic" size={14} />}
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
            placeholder={intake.narrativePlaceholder[locale]}
          />
          <p className="mt-1 text-xs text-ink-muted">{L.narrativeHint}</p>
        </div>

        <div key={formKey} className={`grid gap-5 ${detailCols}`}>
          {intake.showAmount ? (
            <Field label={intake.amountLabel[locale]}>
              <Input
                name="amountTnd"
                type="number"
                step="0.001"
                min="0"
                required={intake.amountRequired}
                placeholder={intake.amountPlaceholder[locale]}
              />
            </Field>
          ) : null}
          <Field label={intake.referenceLabel[locale]}>
            <Input name="reference" type="text" dir="auto" placeholder={intake.referencePlaceholder[locale]} />
          </Field>
          <Field label={L.remedy}>
            <Select name="requestedRemedy" defaultValue={intake.defaultRemedy}>
              {intake.remedies.map((r) => (
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
            {intake.hint[locale]}
          </p>
          <SubmitButton pendingLabel={L.submitting}>{L.submit}</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
