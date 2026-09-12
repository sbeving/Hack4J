import "server-only";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/domain/events";
import { anchor } from "@/lib/ledger";
import { canonicalJson } from "@/lib/canonical";
import { keccakOfString } from "@/lib/hash";
import { renderHtmlToPdf } from "@/lib/pdf/render";
import { saveArtifact } from "@/lib/storage";
import { buildSettlementHtml, type SettlementSnapshot } from "@/lib/settlement/build";
import { REMEDY_LABEL, label } from "@/lib/domain/constants";

const ACTIVE = ["dossier_filed", "in_mediation", "settlement_pending", "settled", "closed_unsettled"];

export async function getResolverQueue(orgId: string) {
  return prisma.case.findMany({
    where: { institutionOrgId: orgId, state: { in: ACTIVE } },
    orderBy: { updatedAt: "desc" },
    include: {
      claimantUser: { include: { org: true } },
      providerOrg: true,
      dossiers: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getResolverCase(caseId: string, orgId: string) {
  return prisma.case.findFirst({
    where: { id: caseId, institutionOrgId: orgId },
    include: {
      claimantUser: { include: { org: true } },
      providerOrg: true,
      institutionOrg: true,
      evidence: { orderBy: { createdAt: "asc" } },
      notices: { orderBy: { createdAt: "desc" } },
      responses: { orderBy: { createdAt: "asc" }, where: { NOT: { kind: "ai_suggestion" } } },
      dossiers: { orderBy: { createdAt: "desc" } },
      mediations: { include: { settlements: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } },
      events: { orderBy: { sequence: "asc" } },
      anchors: { orderBy: { submittedAt: "asc" } },
    },
  });
}

async function loadCase(caseId: string, orgId: string) {
  const c = await prisma.case.findFirst({ where: { id: caseId, institutionOrgId: orgId } });
  if (!c) throw new Error("case_not_found");
  return c;
}

async function notify(userIds: string[], caseId: string, caseNumber: string, type: string) {
  if (!userIds.length) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      caseId,
      type,
      messageKey: `notif.${type}`,
      params: JSON.stringify({ caseNumber }),
    })),
  });
}

export async function acceptCase(caseId: string, orgId: string, resolverId: string) {
  const c = await loadCase(caseId, orgId);
  if (c.state !== "dossier_filed") throw new Error("not_acceptable");
  const mediation = await prisma.mediation.create({
    data: { caseId, resolverUserId: resolverId, status: "scheduled" },
  });
  await prisma.case.update({ where: { id: caseId }, data: { state: "in_mediation", version: { increment: 1 } } });
  await recordEvent(caseId, "resolver_accepted", { actor: resolverId, payload: { mediationId: mediation.id } });
  await notify([c.claimantUserId], caseId, c.caseNumber, "case_accepted");
  return mediation;
}

export async function scheduleMediation(caseId: string, orgId: string, resolverId: string, scheduledAtISO: string) {
  const c = await loadCase(caseId, orgId);
  const mediation = await prisma.mediation.findFirst({ where: { caseId }, orderBy: { createdAt: "desc" } });
  if (!mediation) throw new Error("no_mediation");
  await prisma.mediation.update({ where: { id: mediation.id }, data: { scheduledAt: new Date(scheduledAtISO) } });
  await recordEvent(caseId, "mediation_scheduled", { actor: resolverId, payload: { scheduledAt: scheduledAtISO } });
  const agents = await prisma.user.findMany({ where: { orgId: c.providerOrgId, role: "provider_agent" }, select: { id: true } });
  await notify([c.claimantUserId, ...agents.map((a) => a.id)], caseId, c.caseNumber, "mediation_scheduled");
}

export async function publishTerms(
  caseId: string,
  orgId: string,
  resolverId: string,
  terms: { obligations: string; remedyType: string; amountMillimes: number | null; performanceDate: string | null }
) {
  const c = await loadCase(caseId, orgId);
  if (c.state !== "in_mediation") throw new Error("not_in_mediation");
  const mediation = await prisma.mediation.findFirst({ where: { caseId }, orderBy: { createdAt: "desc" } });
  if (!mediation) throw new Error("no_mediation");

  const version = (await prisma.settlement.count({ where: { mediationId: mediation.id } })) + 1;
  const termsCanonical = canonicalJson({ ...terms, version });
  const termsHash = keccakOfString(termsCanonical);

  const settlement = await prisma.settlement.create({
    data: {
      mediationId: mediation.id,
      version,
      termsHash,
      terms: JSON.stringify(terms),
      status: "proposed",
      acknowledgements: JSON.stringify([]),
    },
  });
  await prisma.case.update({ where: { id: caseId }, data: { state: "settlement_pending", version: { increment: 1 } } });
  await recordEvent(caseId, "settlement_terms_published", { actor: resolverId, payload: { settlementId: settlement.id, termsHash, version } });

  const agents = await prisma.user.findMany({ where: { orgId: c.providerOrgId, role: "provider_agent" }, select: { id: true } });
  await notify([c.claimantUserId, ...agents.map((a) => a.id)], caseId, c.caseNumber, "settlement_proposed");
  return settlement;
}

/** Called by claimant/provider actions to acknowledge the exact current terms. */
export async function acknowledgeTerms(caseId: string, settlementId: string, party: "claimant" | "provider") {
  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } });
  if (!settlement) throw new Error("settlement_not_found");
  let acks: { party: string; at: string }[] = [];
  try {
    acks = JSON.parse(settlement.acknowledgements ?? "[]");
  } catch {
    acks = [];
  }
  if (!acks.some((a) => a.party === party)) {
    acks.push({ party, at: new Date().toISOString() });
    await prisma.settlement.update({ where: { id: settlementId }, data: { acknowledgements: JSON.stringify(acks) } });
    await recordEvent(caseId, "terms_acknowledged", { actor: party, payload: { settlementId } });
  }
  return acks;
}

export async function recordSettlement(caseId: string, orgId: string, resolverId: string, settlementId: string) {
  const c = await prisma.case.findFirst({
    where: { id: caseId, institutionOrgId: orgId },
    include: { claimantUser: { include: { org: true } }, providerOrg: true, institutionOrg: true },
  });
  if (!c) throw new Error("case_not_found");
  if (c.state !== "settlement_pending") throw new Error("not_settlement_pending");

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: { mediation: true },
  });
  if (!settlement) throw new Error("settlement_not_found");

  const terms = JSON.parse(settlement.terms) as {
    obligations: string;
    remedyType: string;
    amountMillimes: number | null;
    performanceDate: string | null;
  };
  let acks: { party: string; at: string }[] = [];
  try {
    acks = JSON.parse(settlement.acknowledgements ?? "[]");
  } catch {
    acks = [];
  }

  const snapshot: SettlementSnapshot = {
    caseNumber: c.caseNumber,
    generatedAt: new Date().toISOString(),
    claimant: `${c.claimantUser.name} — ${c.claimantUser.org?.name ?? ""}`,
    provider: c.providerOrg.name,
    institution: c.institutionOrg?.name ?? "",
    mediator: "Officier de conciliation",
    scheduledAt: settlement.mediation.scheduledAt?.toISOString() ?? null,
    obligations: terms.obligations,
    remedyTypeLabel: label(REMEDY_LABEL as Record<string, Record<"fr" | "ar", string>>, terms.remedyType, "fr", terms.remedyType),
    amountMillimes: terms.amountMillimes,
    performanceDate: terms.performanceDate,
    acknowledgements: acks,
    termsHash: settlement.termsHash,
  };

  const pdf = await renderHtmlToPdf(buildSettlementHtml(snapshot));
  const stored = await saveArtifact(`${caseId}/pv-conciliation-${settlement.id}.pdf`, pdf);

  await prisma.settlement.update({
    where: { id: settlementId },
    data: { status: "recorded", pdfKey: stored.storageKey, recordedAt: new Date() },
  });
  await prisma.case.update({ where: { id: caseId }, data: { state: "settled", version: { increment: 1 } } });
  await anchor({ caseId, subjectType: "settlement", subjectId: settlementId, digest: settlement.termsHash });
  await recordEvent(caseId, "settlement_recorded", { actor: resolverId, payload: { settlementId, contentHash: stored.contentHash } });

  const agents = await prisma.user.findMany({ where: { orgId: c.providerOrgId, role: "provider_agent" }, select: { id: true } });
  await notify([c.claimantUserId, ...agents.map((a) => a.id)], caseId, c.caseNumber, "settled");
  return stored;
}

export async function closeUnsettled(caseId: string, orgId: string, resolverId: string, reason: string) {
  const c = await loadCase(caseId, orgId);
  if (c.state !== "in_mediation" && c.state !== "settlement_pending") throw new Error("not_closable");
  await prisma.case.update({
    where: { id: caseId },
    data: { state: "closed_unsettled", escalationReason: reason, version: { increment: 1 } },
  });
  await recordEvent(caseId, "closed_unsettled", { actor: resolverId, payload: { reason } });
  const agents = await prisma.user.findMany({ where: { orgId: c.providerOrgId, role: "provider_agent" }, select: { id: true } });
  await notify([c.claimantUserId, ...agents.map((a) => a.id)], caseId, c.caseNumber, "closed_unsettled");
}
