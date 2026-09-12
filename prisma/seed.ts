import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function wipe() {
  // Delete in FK-dependency order.
  await prisma.notification.deleteMany();
  await prisma.anchorReceipt.deleteMany();
  await prisma.caseEvent.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.mediation.deleteMany();
  await prisma.dossier.deleteMany();
  await prisma.providerResponse.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

async function main() {
  await wipe();

  // ── Organizations ─────────────────────────────────────────────────────────
  await prisma.organization.createMany({
    data: [
      { id: "org-sulha", kind: "operator", name: "Sulha", nameAr: "صلح", stateOwned: false },
      {
        id: "org-steg",
        kind: "provider",
        name: "STEG — Société Tunisienne de l'Électricité et du Gaz",
        nameAr: "الشركة التونسية للكهرباء والغاز",
        stateOwned: true,
        slaHours: 72,
        branding: JSON.stringify({ color: "#0B6BB2", initials: "STEG" }),
      },
      {
        id: "org-sonede",
        kind: "provider",
        name: "SONEDE — Société Nationale d'Exploitation et de Distribution des Eaux",
        nameAr: "الشركة الوطنية لاستغلال وتوزيع المياه",
        stateOwned: true,
        slaHours: 72,
        branding: JSON.stringify({ color: "#0E8F8F", initials: "SONEDE" }),
      },
      {
        id: "org-laposte",
        kind: "provider",
        name: "La Poste Tunisienne",
        nameAr: "البريد التونسي",
        stateOwned: true,
        slaHours: 96,
        branding: JSON.stringify({ color: "#E6B400", initials: "LP" }),
      },
      {
        id: "org-mediation",
        kind: "institution",
        name: "Centre de Conciliation & Protection du Consommateur",
        nameAr: "مركز المصالحة وحماية المستهلك",
        stateOwned: true,
        branding: JSON.stringify({ color: "#6D28D9", initials: "CCPC" }),
      },
      {
        id: "org-atelier",
        kind: "msme",
        name: "Atelier Amira (menuiserie)",
        nameAr: "ورشة أميرة للنجارة",
        stateOwned: false,
      },
    ],
  });

  // ── Users (demo accounts) ─────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      { id: "user-amira", name: "Amira Ben Salah", nameAr: "أميرة بن صالح", role: "claimant", lang: "fr", orgId: "org-atelier", phone: "+216 20 000 001" },
      { id: "user-sami", name: "Sami Trabelsi", nameAr: "سامي الطرابلسي", role: "provider_agent", lang: "fr", orgId: "org-steg", phone: "+216 20 000 002" },
      { id: "user-karim", name: "Karim Jelassi", nameAr: "كريم الجلاصي", role: "resolver", lang: "fr", orgId: "org-mediation", phone: "+216 20 000 003" },
      { id: "user-admin", name: "Administrateur Sulha", nameAr: "مشرف صلح", role: "admin", lang: "fr", orgId: "org-sulha", phone: "+216 20 000 004" },
    ],
  });

  // ── Historical MSMEs + cases (analytics depth; keeps Amira's list clean) ──
  await prisma.organization.createMany({ data: HISTORY_ORGS });
  await prisma.user.createMany({ data: HISTORY_USERS });
  const history = await seedHistory();

  const orgs = await prisma.organization.count();
  const users = await prisma.user.count();
  const cases = await prisma.case.count();
  console.log(`✔ Seeded ${orgs} orgs, ${users} users, ${cases} cases (${history} historical).`);
}

const HISTORY_ORGS = [
  { id: "org-msme-1", kind: "msme", name: "Boulangerie El Menzah", nameAr: "مخبزة المنزه" },
  { id: "org-msme-2", kind: "msme", name: "Garage Sfax Auto", nameAr: "كراج صفاقس أوتو" },
  { id: "org-msme-3", kind: "msme", name: "Café des Oliviers", nameAr: "مقهى الزياتين" },
  { id: "org-msme-4", kind: "msme", name: "Imprimerie Carthage", nameAr: "مطبعة قرطاج" },
];

const HISTORY_USERS = [
  { id: "user-h1", name: "Nizar Gharbi", role: "claimant", lang: "fr", orgId: "org-msme-1" },
  { id: "user-h2", name: "Fatma Zouari", role: "claimant", lang: "fr", orgId: "org-msme-2" },
  { id: "user-h3", name: "Hedi Mansour", role: "claimant", lang: "fr", orgId: "org-msme-3" },
  { id: "user-h4", name: "Rania Khelifi", role: "claimant", lang: "fr", orgId: "org-msme-4" },
];

type HistorySpec = {
  claimant: string;
  provider: string;
  type: string;
  amountTnd: number;
  daysAgo: number;
  state: string;
  resolutionHrs?: number;
  escalated?: boolean;
};

const HISTORY_DATA: HistorySpec[] = [
  { claimant: "user-h1", provider: "org-steg", type: "billing_error", amountTnd: 640, daysAgo: 78, state: "settled", resolutionHrs: 96, escalated: true },
  { claimant: "user-h2", provider: "org-steg", type: "billing_error", amountTnd: 1250, daysAgo: 71, state: "resolved", resolutionHrs: 34 },
  { claimant: "user-h3", provider: "org-sonede", type: "billing_error", amountTnd: 210, daysAgo: 66, state: "resolved", resolutionHrs: 20 },
  { claimant: "user-h4", provider: "org-laposte", type: "delivery_failure", amountTnd: 480, daysAgo: 60, state: "settled", resolutionHrs: 120, escalated: true },
  { claimant: "user-h1", provider: "org-sonede", type: "service_interruption", amountTnd: 300, daysAgo: 55, state: "resolved", resolutionHrs: 48 },
  { claimant: "user-h2", provider: "org-steg", type: "service_interruption", amountTnd: 900, daysAgo: 49, state: "closed_unsettled", resolutionHrs: 150, escalated: true },
  { claimant: "user-h3", provider: "org-laposte", type: "delivery_failure", amountTnd: 175, daysAgo: 43, state: "resolved", resolutionHrs: 28 },
  { claimant: "user-h4", provider: "org-steg", type: "billing_error", amountTnd: 2100, daysAgo: 38, state: "settled", resolutionHrs: 72, escalated: true },
  { claimant: "user-h1", provider: "org-sonede", type: "deposit_refund", amountTnd: 550, daysAgo: 31, state: "resolved", resolutionHrs: 40 },
  { claimant: "user-h2", provider: "org-laposte", type: "service_damage", amountTnd: 720, daysAgo: 26, state: "settled", resolutionHrs: 110, escalated: true },
  { claimant: "user-h3", provider: "org-steg", type: "billing_error", amountTnd: 430, daysAgo: 19, state: "resolved", resolutionHrs: 22 },
  { claimant: "user-h4", provider: "org-sonede", type: "billing_error", amountTnd: 1600, daysAgo: 14, state: "in_mediation", escalated: true },
  { claimant: "user-h1", provider: "org-steg", type: "service_interruption", amountTnd: 380, daysAgo: 9, state: "provider_review" },
  { claimant: "user-h2", provider: "org-steg", type: "billing_error", amountTnd: 990, daysAgo: 5, state: "notice_sent" },
  { claimant: "user-h3", provider: "org-laposte", type: "delivery_failure", amountTnd: 260, daysAgo: 2, state: "provider_review" },
];

const TERMINAL = new Set(["settled", "resolved", "closed_unsettled"]);

async function seedHistory(): Promise<number> {
  let n = 0;
  for (const s of HISTORY_DATA) {
    const createdAt = new Date(Date.now() - s.daysAgo * 24 * 3600 * 1000);
    const slaStartedAt = new Date(createdAt.getTime() + 3600 * 1000);
    const slaDueAt = new Date(slaStartedAt.getTime() + 72 * 3600 * 1000);
    const terminal = TERMINAL.has(s.state);
    const resolvedAt = terminal ? new Date(createdAt.getTime() + (s.resolutionHrs ?? 48) * 3600 * 1000) : null;

    const c = await prisma.case.create({
      data: {
        caseNumber: `SLH-H-${String(++n).padStart(3, "0")}`,
        claimType: s.type,
        claimantUserId: s.claimant,
        providerOrgId: s.provider,
        institutionOrgId: s.escalated ? "org-mediation" : null,
        amountMillimes: s.amountTnd * 1000,
        narrative: "Litige historique (données de démonstration).",
        priority: "normal",
        state: s.state,
        slaStartedAt,
        slaDueAt,
        escalationReason: s.escalated ? "Contestation du fournisseur" : null,
        createdAt,
        updatedAt: resolvedAt ?? createdAt,
      },
    });

    let seq = 0;
    const ev = (type: string, ts: Date) =>
      prisma.caseEvent.create({ data: { caseId: c.id, sequence: ++seq, type, ts, actor: "seed" } });
    await ev("created", createdAt);
    await ev("notice_sent", new Date(createdAt.getTime() + 3600 * 1000));
    if (s.escalated) await ev("escalation_requested", new Date(createdAt.getTime() + 24 * 3600 * 1000));
    if (resolvedAt) await ev(s.state, resolvedAt);
  }
  return n;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
