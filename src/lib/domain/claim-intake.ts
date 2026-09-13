import {
  CLAIM_TYPES,
  type ClaimType,
  type Locale,
  type RequestedRemedy,
} from "@/lib/domain/constants";

export type ClaimIntakeFields = {
  referenceLabel: Record<Locale, string>;
  referencePlaceholder: Record<Locale, string>;
  amountLabel: Record<Locale, string>;
  amountPlaceholder: Record<Locale, string>;
  showAmount: boolean;
  amountRequired: boolean;
  remedies: RequestedRemedy[];
  defaultRemedy: RequestedRemedy;
  narrativePlaceholder: Record<Locale, string>;
  hint: Record<Locale, string>;
};

export const CLAIM_INTAKE: Record<ClaimType, ClaimIntakeFields> = {
  billing_error: {
    referenceLabel: { fr: "N° de facture", ar: "رقم الفاتورة" },
    referencePlaceholder: { fr: "STEG-2025-004821", ar: "STEG-2025-004821" },
    amountLabel: { fr: "Montant contesté (TND)", ar: "المبلغ المتنازع عليه (د.ت)" },
    amountPlaceholder: { fr: "900.000", ar: "900.000" },
    showAmount: true,
    amountRequired: true,
    remedies: ["correct_bill", "refund"],
    defaultRemedy: "correct_bill",
    narrativePlaceholder: {
      fr: "Ex : STEG m'a facturé 900 dinars de trop sur la ligne « Régularisation »…",
      ar: "مثال: STEG فوترتني 900 دينار زيادة في بند « التسوية »…",
    },
    hint: {
      fr: "Indiquez la facture et le montant en trop — routé vers le service Facturation.",
      ar: "أدخل رقم الفاتورة والمبلغ الزائد — يُوجّه إلى قسم الفوترة.",
    },
  },
  service_interruption: {
    referenceLabel: { fr: "N° compteur / contrat", ar: "رقم العداد / العقد" },
    referencePlaceholder: { fr: "CTR-88421", ar: "CTR-88421" },
    amountLabel: { fr: "Pertes estimées (TND)", ar: "تقدير الخسائر (د.ت)" },
    amountPlaceholder: { fr: "0", ar: "0" },
    showAmount: true,
    amountRequired: false,
    remedies: ["restore_service", "compensation"],
    defaultRemedy: "restore_service",
    narrativePlaceholder: {
      fr: "Ex : coupure d'électricité depuis le 3 mars, atelier à l'arrêt…",
      ar: "مثال: انقطاع الكهرباء منذ 3 مارس، الورشة متوقفة…",
    },
    hint: {
      fr: "Précisez la date de début et l'impact — routé vers le service Technique.",
      ar: "حدّد تاريخ الانقطاع والأثر — يُوجّه إلى القسم الفني.",
    },
  },
  delivery_failure: {
    referenceLabel: { fr: "N° colis / suivi", ar: "رقم الطرد / التتبّع" },
    referencePlaceholder: { fr: "LP-2025-99102", ar: "LP-2025-99102" },
    amountLabel: { fr: "Valeur du colis (TND)", ar: "قيمة الطرد (د.ت)" },
    amountPlaceholder: { fr: "150.000", ar: "150.000" },
    showAmount: true,
    amountRequired: false,
    remedies: ["refund", "compensation"],
    defaultRemedy: "refund",
    narrativePlaceholder: {
      fr: "Ex : colis non livré après 12 jours, marchandises pour clients…",
      ar: "مثال: الطرد لم يُسلّم بعد 12 يومًا، بضاعة للزبائن…",
    },
    hint: {
      fr: "Indiquez le numéro de suivi et la date prévue — routé vers la Logistique.",
      ar: "أدخل رقم التتبّع والتاريخ المتوقع — يُوجّه إلى قسم اللوجستيك.",
    },
  },
  deposit_refund: {
    referenceLabel: { fr: "Réf. contrat / caution", ar: "مرجع العقد / الضمان" },
    referencePlaceholder: { fr: "CAU-2024-1180", ar: "CAU-2024-1180" },
    amountLabel: { fr: "Montant de la caution (TND)", ar: "مبلغ الضمان (د.ت)" },
    amountPlaceholder: { fr: "500.000", ar: "500.000" },
    showAmount: true,
    amountRequired: true,
    remedies: ["refund"],
    defaultRemedy: "refund",
    narrativePlaceholder: {
      fr: "Ex : caution de 500 TND non remboursée 60 jours après résiliation…",
      ar: "مثال: ضمان 500 دينار لم يُسترجع بعد 60 يومًا من إنهاء العقد…",
    },
    hint: {
      fr: "Indiquez le montant retenu et la date de fin de contrat — routé vers la Comptabilité.",
      ar: "أدخل المبلغ المحجوز وتاريخ انتهاء العقد — يُوجّه إلى قسم المحاسبة.",
    },
  },
  service_damage: {
    referenceLabel: { fr: "Réf. incident / dossier", ar: "مرجع الحادث / الملف" },
    referencePlaceholder: { fr: "INC-2025-0044", ar: "INC-2025-0044" },
    amountLabel: { fr: "Estimation des dommages (TND)", ar: "تقدير الأضرار (د.ت)" },
    amountPlaceholder: { fr: "1200.000", ar: "1200.000" },
    showAmount: true,
    amountRequired: true,
    remedies: ["compensation", "refund"],
    defaultRemedy: "compensation",
    narrativePlaceholder: {
      fr: "Ex : équipement endommagé lors d'une intervention STEG…",
      ar: "مثال: تلف معدات أثناء تدخّل STEG…",
    },
    hint: {
      fr: "Décrivez les dommages et quand ils sont survenus — routé vers les Réclamations.",
      ar: "صف الأضرار ومتى وقعت — يُوجّه إلى قسم الشكاوى.",
    },
  },
};

const GENERIC_INTAKE: ClaimIntakeFields = {
  referenceLabel: { fr: "Référence (contrat / facture)", ar: "المرجع (رقم العقد/الفاتورة)" },
  referencePlaceholder: { fr: "STEG-0000-0000", ar: "STEG-0000-0000" },
  amountLabel: { fr: "Montant contesté (TND)", ar: "المبلغ المتنازع عليه (د.ت)" },
  amountPlaceholder: { fr: "900.000", ar: "900.000" },
  showAmount: true,
  amountRequired: false,
  remedies: ["correct_bill", "refund", "restore_service", "compensation"],
  defaultRemedy: "correct_bill",
  narrativePlaceholder: {
    fr: "Ex : STEG m'a facturé 900 dinars de trop ce mois-ci…",
    ar: "مثال: STEG فوترتني 900 دينار زيادة هذا الشهر…",
  },
  hint: {
    fr: "L'IA classe la réclamation et la route vers le bon guichet.",
    ar: "يصنّف الذكاء الاصطناعي المطلب ويوجّهه إلى المكتب المناسب.",
  },
};

export function intakeFor(claimType: ClaimType | "auto", locale: Locale): ClaimIntakeFields {
  if (claimType === "auto" || !CLAIM_TYPES.includes(claimType)) {
    return GENERIC_INTAKE;
  }
  return CLAIM_INTAKE[claimType];
}
