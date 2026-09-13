// Moufehma domain vocabulary + state machine.
// SQLite has no enums, so these string unions are the source of truth and are
// enforced in the app layer (zod schemas in src/lib/domain/schemas.ts).

export type Locale = "fr" | "ar";
export const LOCALES: Locale[] = ["fr", "ar"];
export const DEFAULT_LOCALE: Locale = "fr";
export const dirOf = (l: Locale): "rtl" | "ltr" => (l === "ar" ? "rtl" : "ltr");

// ── Roles ──────────────────────────────────────────────────────────────────
export type Role = "claimant" | "provider_agent" | "resolver" | "admin";
export const ROLES: Role[] = ["claimant", "provider_agent", "resolver", "admin"];

export const ROLE_LABEL: Record<Role, Record<Locale, string>> = {
  claimant: { fr: "PME / Réclamant", ar: "المؤسسة / المشتكي" },
  provider_agent: { fr: "Guichet fournisseur", ar: "مكتب المزوّد" },
  resolver: { fr: "Médiateur neutre", ar: "الوسيط المحايد" },
  admin: { fr: "Administrateur réseau", ar: "مشرف الشبكة" },
};

export const ROLE_HOME: Record<Role, string> = {
  claimant: "/claimant",
  provider_agent: "/provider",
  resolver: "/institution",
  admin: "/admin",
};

// ── Claim types ──────────────────────────────────────────────────────────────
export type ClaimType =
  | "billing_error"
  | "service_interruption"
  | "delivery_failure"
  | "deposit_refund"
  | "service_damage";

export const CLAIM_TYPES: ClaimType[] = [
  "billing_error",
  "service_interruption",
  "delivery_failure",
  "deposit_refund",
  "service_damage",
];

export const CLAIM_TYPE_LABEL: Record<ClaimType, Record<Locale, string>> = {
  billing_error: { fr: "Erreur de facturation", ar: "خطأ في الفوترة" },
  service_interruption: { fr: "Interruption de service", ar: "انقطاع الخدمة" },
  delivery_failure: { fr: "Défaut de livraison", ar: "فشل التوصيل" },
  deposit_refund: { fr: "Litige de caution / remboursement", ar: "نزاع الضمان / الاسترجاع" },
  service_damage: { fr: "Dommage lié au service", ar: "ضرر ناتج عن الخدمة" },
};

// Deterministic routing: claim type → provider department/desk label.
export const CLAIM_TYPE_DESK: Record<ClaimType, Record<Locale, string>> = {
  billing_error: { fr: "Service Facturation", ar: "قسم الفوترة" },
  service_interruption: { fr: "Service Technique / Réseau", ar: "القسم الفني / الشبكة" },
  delivery_failure: { fr: "Service Logistique", ar: "قسم اللوجستيك" },
  deposit_refund: { fr: "Service Comptabilité", ar: "قسم المحاسبة" },
  service_damage: { fr: "Service Réclamations", ar: "قسم الشكاوى" },
};

// ── Requested remedies ───────────────────────────────────────────────────────
export type RequestedRemedy = "correct_bill" | "refund" | "restore_service" | "compensation";
export const REMEDY_LABEL: Record<RequestedRemedy, Record<Locale, string>> = {
  correct_bill: { fr: "Rectifier la facture", ar: "تصحيح الفاتورة" },
  refund: { fr: "Remboursement", ar: "استرجاع المبلغ" },
  restore_service: { fr: "Rétablir le service", ar: "إعادة الخدمة" },
  compensation: { fr: "Indemnisation", ar: "تعويض" },
};

// ── Provider response kinds ──────────────────────────────────────────────────
// AI rows are cached on the case as ProviderResponse rows (their `message` holds
// JSON). They are never real exchanges — never render them in a thread.
export const AI_RESPONSE_KINDS = ["ai_suggestion", "ai_mediation", "ai_report"];
export const isAiResponse = (kind: string) => AI_RESPONSE_KINDS.includes(kind);

// ── Priority ─────────────────────────────────────────────────────────────────
export type Priority = "low" | "normal" | "high" | "urgent";
export const PRIORITY_LABEL: Record<Priority, Record<Locale, string>> = {
  low: { fr: "Basse", ar: "منخفضة" },
  normal: { fr: "Normale", ar: "عادية" },
  high: { fr: "Haute", ar: "عالية" },
  urgent: { fr: "Urgente", ar: "عاجلة" },
};

// ── Case lifecycle states ────────────────────────────────────────────────────
export type CaseState =
  | "draft"
  | "filed"
  | "notice_sent"
  | "provider_review"
  | "resolution_proposed"
  | "resolution_agreed"
  | "resolved"
  | "escalation_pending"
  | "dossier_filed"
  | "in_mediation"
  | "settlement_pending"
  | "settled"
  | "closed_unsettled"
  | "withdrawn";

export const TERMINAL_STATES: CaseState[] = ["resolved", "settled", "closed_unsettled", "withdrawn"];
export const isTerminal = (s: CaseState) => TERMINAL_STATES.includes(s);

export const STATE_LABEL: Record<CaseState, Record<Locale, string>> = {
  draft: { fr: "Brouillon", ar: "مسودة" },
  filed: { fr: "Déposé", ar: "تم الإيداع" },
  notice_sent: { fr: "Mise en demeure envoyée", ar: "تم إرسال الإنذار" },
  provider_review: { fr: "En examen (fournisseur)", ar: "قيد المراجعة (المزوّد)" },
  resolution_proposed: { fr: "Résolution proposée", ar: "تم اقتراح حل" },
  resolution_agreed: { fr: "Confirmation mutuelle (1/2)", ar: "تأكيد متبادل (1/2)" },
  resolved: { fr: "Réglé (accord direct)", ar: "تمت التسوية (اتفاق مباشر)" },
  escalation_pending: { fr: "Escalade en cours", ar: "قيد التصعيد" },
  dossier_filed: { fr: "Dossier transmis", ar: "تم إرسال الملف" },
  in_mediation: { fr: "En médiation", ar: "في الوساطة" },
  settlement_pending: { fr: "Accord en attente", ar: "التسوية قيد الانتظار" },
  settled: { fr: "Réglé (médiation)", ar: "تمت التسوية (وساطة)" },
  closed_unsettled: { fr: "Clôturé sans accord", ar: "أُغلق دون اتفاق" },
  withdrawn: { fr: "Retiré", ar: "تم السحب" },
};

// Whose turn it is (drives the "next action" banner).
export const STATE_OWNER: Record<CaseState, Role | "system" | null> = {
  draft: "claimant",
  filed: "system",
  notice_sent: "provider_agent",
  provider_review: "provider_agent",
  resolution_proposed: "claimant",
  resolution_agreed: "provider_agent",
  resolved: null,
  escalation_pending: "system",
  dossier_filed: "resolver",
  in_mediation: "resolver",
  settlement_pending: "claimant",
  settled: null,
  closed_unsettled: null,
  withdrawn: null,
};

// ── Delivery-app tracker (customer-facing, collapses states into stages) ──────
export type TrackerStage = {
  key: string;
  label: Record<Locale, string>;
};
export const TRACKER_STAGES: TrackerStage[] = [
  { key: "filed", label: { fr: "Déposé", ar: "تم الإيداع" } },
  { key: "notice", label: { fr: "Mise en demeure", ar: "الإنذار" } },
  { key: "provider", label: { fr: "Examen fournisseur", ar: "مراجعة المزوّد" } },
  { key: "outcome", label: { fr: "Résolu / Escaladé", ar: "الحل / التصعيد" } },
  { key: "mediation", label: { fr: "Médiation", ar: "الوساطة" } },
  { key: "settled", label: { fr: "Réglé", ar: "تمت التسوية" } },
];

// internal state → tracker stage index (0-based)
export const STATE_TO_STAGE: Record<CaseState, number> = {
  draft: 0,
  filed: 0,
  notice_sent: 1,
  provider_review: 2,
  resolution_proposed: 2,
  resolution_agreed: 3,
  resolved: 5,
  escalation_pending: 3,
  dossier_filed: 4,
  in_mediation: 4,
  settlement_pending: 4,
  settled: 5,
  closed_unsettled: 5,
  withdrawn: 5,
};

// ── State machine: command → { from[], to } with the role allowed to fire it ──
export type Command =
  | "submit"
  | "accept_notice_delivery" // system/worker
  | "provider_acknowledge"
  | "provider_request_info"
  | "provider_contest"
  | "provider_propose_remedy"
  | "claimant_accept_remedy"
  | "claimant_decline_remedy"
  | "provider_confirm_resolution"
  | "request_escalation"
  | "file_dossier" // system/worker
  | "resolver_accept"
  | "resolver_publish_terms"
  | "acknowledge_terms"
  | "record_settlement"
  | "close_unsettled"
  | "withdraw";

export type TransitionRule = {
  from: CaseState[];
  to: CaseState;
  by: Role | "system";
};

export const TRANSITIONS: Record<Command, TransitionRule> = {
  submit: { from: ["draft"], to: "filed", by: "claimant" },
  accept_notice_delivery: { from: ["filed"], to: "notice_sent", by: "system" },
  provider_acknowledge: { from: ["notice_sent", "provider_review"], to: "provider_review", by: "provider_agent" },
  provider_request_info: { from: ["notice_sent", "provider_review"], to: "provider_review", by: "provider_agent" },
  provider_contest: { from: ["notice_sent", "provider_review"], to: "provider_review", by: "provider_agent" },
  provider_propose_remedy: { from: ["provider_review"], to: "resolution_proposed", by: "provider_agent" },
  // Direct path is a two-signature agreement: claimant confirms, then the provider
  // countersigns → resolved. Both entities confirm before it becomes "Réglé".
  claimant_accept_remedy: { from: ["resolution_proposed"], to: "resolution_agreed", by: "claimant" },
  claimant_decline_remedy: { from: ["resolution_proposed"], to: "provider_review", by: "claimant" },
  provider_confirm_resolution: { from: ["resolution_agreed"], to: "resolved", by: "provider_agent" },
  request_escalation: {
    from: ["notice_sent", "provider_review", "resolution_proposed"],
    to: "escalation_pending",
    by: "claimant",
  },
  file_dossier: { from: ["escalation_pending"], to: "dossier_filed", by: "system" },
  resolver_accept: { from: ["dossier_filed"], to: "in_mediation", by: "resolver" },
  resolver_publish_terms: { from: ["in_mediation"], to: "settlement_pending", by: "resolver" },
  acknowledge_terms: { from: ["settlement_pending"], to: "settlement_pending", by: "claimant" },
  record_settlement: { from: ["settlement_pending"], to: "settled", by: "resolver" },
  close_unsettled: { from: ["in_mediation"], to: "closed_unsettled", by: "resolver" },
  withdraw: {
    from: [
      "draft",
      "filed",
      "notice_sent",
      "provider_review",
      "resolution_proposed",
      "resolution_agreed",
      "escalation_pending",
      "dossier_filed",
      "in_mediation",
    ],
    to: "withdrawn",
    by: "claimant",
  },
};

export function canFire(command: Command, state: CaseState): boolean {
  return TRANSITIONS[command]?.from.includes(state) ?? false;
}

/** Safe label lookup — tolerates unknown keys (bad/legacy data) without crashing. */
export function label(
  map: Record<string, Record<Locale, string>>,
  key: string,
  locale: Locale,
  fallback?: string
): string {
  return map[key]?.[locale] ?? fallback ?? key;
}
