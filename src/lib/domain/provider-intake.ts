import {
  CLAIM_TYPES,
  type ClaimType,
  type Locale,
} from "@/lib/domain/constants";
import { CLAIM_INTAKE, type ClaimIntakeFields, intakeFor } from "@/lib/domain/claim-intake";

export type ProviderSector = "utility" | "postal";

export type ProviderProfile = {
  sector: ProviderSector;
  shortName: Record<Locale, string>;
  sectorLabel: Record<Locale, string>;
  claimTypes: ClaimType[];
  /** Per claim-type field overrides merged onto the base intake config. */
  overrides: Partial<Record<ClaimType, Partial<ClaimIntakeFields>>>;
};

/** Known demo providers — keyed by organization id from seed. */
export const PROVIDER_PROFILES: Record<string, ProviderProfile> = {
  "org-steg": {
    sector: "utility",
    shortName: { fr: "STEG", ar: "STEG" },
    sectorLabel: { fr: "Électricité & gaz", ar: "كهرباء وغاز" },
    claimTypes: ["billing_error", "service_interruption", "deposit_refund", "service_damage"],
    overrides: {
      billing_error: {
        referencePlaceholder: { fr: "STEG-2025-004821", ar: "STEG-2025-004821" },
        narrativePlaceholder: {
          fr: "Ex : STEG m'a facturé 900 dinars de trop sur la ligne « Régularisation »…",
          ar: "مثال: STEG فوترتني 900 دينار زيادة في بند « التسوية »…",
        },
        hint: {
          fr: "Facture STEG et montant contesté — routé vers le service Facturation STEG.",
          ar: "فاتورة STEG والمبلغ المتنازع عليه — يُوجّه إلى قسم الفوترة.",
        },
      },
      service_interruption: {
        referenceLabel: { fr: "N° compteur / abonnement STEG", ar: "رقم العداد / اشتراك STEG" },
        referencePlaceholder: { fr: "CTR-STEG-88421", ar: "CTR-STEG-88421" },
        narrativePlaceholder: {
          fr: "Ex : coupure d'électricité depuis le 3 mars, atelier à l'arrêt…",
          ar: "مثال: انقطاع الكهرباء منذ 3 مارس، الورشة متوقفة…",
        },
        hint: {
          fr: "Date de coupure et impact sur l'activité — routé vers le service Technique STEG.",
          ar: "تاريخ الانقطاع والأثر على النشاط — يُوجّه إلى القسم الفني.",
        },
      },
      deposit_refund: {
        referencePlaceholder: { fr: "CAU-STEG-2024-1180", ar: "CAU-STEG-2024-1180" },
        narrativePlaceholder: {
          fr: "Ex : caution STEG de 500 TND non remboursée après résiliation du contrat…",
          ar: "مثال: ضمان STEG بقيمة 500 دينار لم يُسترجع بعد إنهاء العقد…",
        },
        hint: {
          fr: "Montant retenu et date de fin de contrat — routé vers la Comptabilité STEG.",
          ar: "المبلغ المحجوز وتاريخ انتهاء العقد — يُوجّه إلى المحاسبة.",
        },
      },
      service_damage: {
        referencePlaceholder: { fr: "INC-STEG-2025-0044", ar: "INC-STEG-2025-0044" },
        narrativePlaceholder: {
          fr: "Ex : équipement endommagé lors d'une intervention STEG sur le compteur…",
          ar: "مثال: تلف معدات أثناء تدخّل STEG على العداد…",
        },
        hint: {
          fr: "Dommages lors d'une intervention STEG — routé vers le service Réclamations.",
          ar: "أضرار أثناء تدخّل STEG — يُوجّه إلى قسم الشكاوى.",
        },
      },
    },
  },
  "org-sonede": {
    sector: "utility",
    shortName: { fr: "SONEDE", ar: "SONEDE" },
    sectorLabel: { fr: "Eau potable", ar: "المياه" },
    claimTypes: ["billing_error", "service_interruption", "deposit_refund", "service_damage"],
    overrides: {
      billing_error: {
        referencePlaceholder: { fr: "SONEDE-2025-003412", ar: "SONEDE-2025-003412" },
        narrativePlaceholder: {
          fr: "Ex : SONEDE m'a facturé un index erroné, consommation gonflée…",
          ar: "مثال: SONEDE فوترتني بمؤشّر خاطئ، استهلاك مبالغ فيه…",
        },
        hint: {
          fr: "Facture d'eau et montant contesté — routé vers la Facturation SONEDE.",
          ar: "فاتورة المياه والمبلغ المتنازع عليه — يُوجّه إلى قسم الفوترة.",
        },
      },
      service_interruption: {
        referenceLabel: { fr: "N° compteur / branchement SONEDE", ar: "رقم العداد / التوصيل SONEDE" },
        referencePlaceholder: { fr: "CTR-SONEDE-55201", ar: "CTR-SONEDE-55201" },
        narrativePlaceholder: {
          fr: "Ex : coupure d'eau depuis 5 jours, impossible d'approvisionner l'atelier…",
          ar: "مثال: انقطاع الماء منذ 5 أيام، مستحيل تزويد الورشة…",
        },
        hint: {
          fr: "Date de coupure et impact — routé vers le service Réseau SONEDE.",
          ar: "تاريخ الانقطاع والأثر — يُوجّه إلى قسم الشبكة.",
        },
      },
      deposit_refund: {
        referencePlaceholder: { fr: "CAU-SONEDE-2024-0902", ar: "CAU-SONEDE-2024-0902" },
        narrativePlaceholder: {
          fr: "Ex : caution de branchement SONEDE non remboursée après résiliation…",
          ar: "مثال: ضمان التوصيل لم يُسترجع بعد إنهاء الاشتراك…",
        },
        hint: {
          fr: "Montant retenu et fin de contrat — routé vers la Comptabilité SONEDE.",
          ar: "المبلغ المحجوز ونهاية الاشتراك — يُوجّه إلى المحاسبة.",
        },
      },
      service_damage: {
        referencePlaceholder: { fr: "INC-SONEDE-2025-0012", ar: "INC-SONEDE-2025-0012" },
        narrativePlaceholder: {
          fr: "Ex : fuite causée par une mauvaise réparation SONEDE, dégâts au local…",
          ar: "مثال: تسرّب بسبب إصلاح سيئ من SONEDE، أضرار بالمحل…",
        },
        hint: {
          fr: "Dommages liés à une intervention SONEDE — routé vers les Réclamations.",
          ar: "أضرار مرتبطة بتدخّل SONEDE — يُوجّه إلى قسم الشكاوى.",
        },
      },
    },
  },
  "org-laposte": {
    sector: "postal",
    shortName: { fr: "La Poste", ar: "البريد" },
    sectorLabel: { fr: "Colis & services postaux", ar: "طرود وخدمات بريدية" },
    claimTypes: ["delivery_failure", "billing_error", "service_damage"],
    overrides: {
      delivery_failure: {
        referenceLabel: { fr: "N° colis / suivi La Poste", ar: "رقم الطرد / تتبّع البريد" },
        referencePlaceholder: { fr: "LP-2025-99102", ar: "LP-2025-99102" },
        narrativePlaceholder: {
          fr: "Ex : colis non livré après 12 jours, marchandises pour clients en attente…",
          ar: "مثال: الطرد لم يُسلّم بعد 12 يومًا، بضاعة للزبائن في انتظار…",
        },
        hint: {
          fr: "Numéro de suivi et date de livraison prévue — routé vers la Logistique La Poste.",
          ar: "رقم التتبّع وتاريخ التسليم المتوقع — يُوجّه إلى اللوجستيك.",
        },
      },
      billing_error: {
        referenceLabel: { fr: "N° bordereau / facture postale", ar: "رقم الوصل / فاتورة بريدية" },
        referencePlaceholder: { fr: "LP-FAC-2025-4401", ar: "LP-FAC-2025-4401" },
        amountLabel: { fr: "Frais postaux contestés (TND)", ar: "الرسوم البريدية المتنازع عليها (د.ت)" },
        narrativePlaceholder: {
          fr: "Ex : La Poste m'a facturé des frais d'affranchissement en double…",
          ar: "مثال: البريد فوترني رسوم توصيل مكررة…",
        },
        hint: {
          fr: "Bordereau et montant contesté — routé vers le service Facturation La Poste.",
          ar: "الوصل والمبلغ المتنازع عليه — يُوجّه إلى قسم الفوترة.",
        },
      },
      service_damage: {
        referenceLabel: { fr: "N° colis endommagé", ar: "رقم الطرد المتضرر" },
        referencePlaceholder: { fr: "LP-2025-77831", ar: "LP-2025-77831" },
        amountLabel: { fr: "Valeur du contenu endommagé (TND)", ar: "قيمة المحتوى المتضرر (د.ت)" },
        narrativePlaceholder: {
          fr: "Ex : colis reçu écrasé, marchandises cassées à la livraison…",
          ar: "مثال: الطرد وصل مكسورًا، البضاعة تالفة عند التسليم…",
        },
        hint: {
          fr: "Colis endommagé ou contenu abîmé — routé vers le service Réclamations La Poste.",
          ar: "طرد متضرر أو محتوى تالف — يُوجّه إلى قسم الشكاوى.",
        },
      },
    },
  },
};

const SECTOR_CLAIM_TYPES: Record<ProviderSector, ClaimType[]> = {
  utility: ["billing_error", "service_interruption", "deposit_refund", "service_damage"],
  postal: ["delivery_failure", "billing_error", "service_damage"],
};

function mergeIntake(base: ClaimIntakeFields, patch?: Partial<ClaimIntakeFields>): ClaimIntakeFields {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    referenceLabel: patch.referenceLabel ?? base.referenceLabel,
    referencePlaceholder: patch.referencePlaceholder ?? base.referencePlaceholder,
    amountLabel: patch.amountLabel ?? base.amountLabel,
    amountPlaceholder: patch.amountPlaceholder ?? base.amountPlaceholder,
    narrativePlaceholder: patch.narrativePlaceholder ?? base.narrativePlaceholder,
    hint: patch.hint ?? base.hint,
    remedies: patch.remedies ?? base.remedies,
    defaultRemedy: patch.defaultRemedy ?? base.defaultRemedy,
    showAmount: patch.showAmount ?? base.showAmount,
    amountRequired: patch.amountRequired ?? base.amountRequired,
  };
}

export function providerProfile(providerId: string): ProviderProfile | null {
  return PROVIDER_PROFILES[providerId] ?? null;
}

export function claimTypesForProvider(providerId: string): ClaimType[] {
  const profile = providerProfile(providerId);
  if (profile) return profile.claimTypes;
  return [...CLAIM_TYPES];
}

export function intakeForContext(
  providerId: string,
  claimType: ClaimType | "auto",
  locale: Locale
): ClaimIntakeFields {
  const base = intakeFor(claimType, locale);
  const profile = providerProfile(providerId);
  if (!profile || claimType === "auto") {
    if (profile && claimType === "auto") {
      return mergeIntake(base, {
        hint: {
          fr: `L'IA classe parmi les litiges ${profile.sectorLabel.fr} (${profile.shortName.fr}) et route vers le bon guichet.`,
          ar: `يصنّف الذكاء الاصطناعي ضمن نزاعات ${profile.sectorLabel.ar} (${profile.shortName.ar}) ويوجّه إلى المكتب المناسب.`,
        },
      });
    }
    return base;
  }
  return mergeIntake(base, profile.overrides[claimType]);
}

export function sectorForProvider(providerId: string): ProviderSector | null {
  return providerProfile(providerId)?.sector ?? null;
}

export function isClaimTypeAllowed(providerId: string, claimType: ClaimType): boolean {
  return claimTypesForProvider(providerId).includes(claimType);
}

/** Fallback sector claim types when provider id is unknown (e.g. new org in DB). */
export function defaultClaimTypesForUnknownProvider(): ClaimType[] {
  return [...CLAIM_TYPES];
}

export { SECTOR_CLAIM_TYPES };
