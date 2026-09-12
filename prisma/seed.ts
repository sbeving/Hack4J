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

  const orgs = await prisma.organization.count();
  const users = await prisma.user.count();
  console.log(`✔ Seeded ${orgs} organizations and ${users} demo users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
