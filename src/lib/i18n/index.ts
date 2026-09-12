import type { Locale } from "@/lib/domain/constants";

// UI chrome strings. Domain vocabulary (roles, states, claim types) lives in
// src/lib/domain/constants.ts. Grow this dictionary phase by phase.
type Dict = Record<string, string>;

const fr: Dict = {
  "app.name": "Sulha",
  "app.tagline": "Le réseau neutre de règlement des litiges pour les PME tunisiennes",
  "app.arabic": "صلح",
  "nav.dashboard": "Tableau de bord",
  "nav.newClaim": "Nouvelle réclamation",
  "nav.notifications": "Notifications",
  "nav.logout": "Se déconnecter",
  "nav.language": "العربية",
  "demo.title": "Démonstration — choisissez un rôle",
  "demo.subtitle": "Chaque compte ouvre un espace de travail distinct avec de vraies vérifications d'accès.",
  "demo.enter": "Entrer",
  "demo.badge": "DÉMO",
  "common.case": "Dossier",
  "common.amount": "Montant",
  "common.provider": "Fournisseur",
  "common.status": "Statut",
  "common.priority": "Priorité",
  "common.deadline": "Échéance",
  "common.nextAction": "Prochaine action",
  "common.loading": "Chargement…",
  "common.none": "Aucun",
  "common.simulated": "Simulé",
};

const ar: Dict = {
  "app.name": "صلح",
  "app.tagline": "الشبكة المحايدة لتسوية نزاعات المؤسسات الصغرى والمتوسطة في تونس",
  "app.arabic": "صلح",
  "nav.dashboard": "لوحة التحكّم",
  "nav.newClaim": "مطلب جديد",
  "nav.notifications": "الإشعارات",
  "nav.logout": "تسجيل الخروج",
  "nav.language": "Français",
  "demo.title": "عرض توضيحي — اختر دورًا",
  "demo.subtitle": "كل حساب يفتح مساحة عمل منفصلة مع تحقّق فعلي من الصلاحيات.",
  "demo.enter": "دخول",
  "demo.badge": "عرض",
  "common.case": "الملف",
  "common.amount": "المبلغ",
  "common.provider": "المزوّد",
  "common.status": "الحالة",
  "common.priority": "الأولوية",
  "common.deadline": "الأجل",
  "common.nextAction": "الإجراء التالي",
  "common.loading": "جارٍ التحميل…",
  "common.none": "لا شيء",
  "common.simulated": "محاكاة",
};

const DICTS: Record<Locale, Dict> = { fr, ar };

export function t(locale: Locale, key: string): string {
  return DICTS[locale]?.[key] ?? DICTS.fr[key] ?? key;
}

export function translator(locale: Locale) {
  return (key: string) => t(locale, key);
}
