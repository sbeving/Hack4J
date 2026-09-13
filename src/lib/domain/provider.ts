import "server-only";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/domain/events";
import { suggestResolution, type ResolutionSuggestion } from "@/lib/ai/provider-tasks";
import { millimesToTnd } from "@/lib/money";
import type { CaseState } from "@/lib/domain/constants";

const ACTIVE_STATES = [
  "filed",
  "notice_sent",
  "provider_review",
  "resolution_proposed",
  "escalation_pending",
  "dossier_filed",
  "in_mediation",
  "settlement_pending",
  "resolved",
  "settled",
  "closed_unsettled",
];

export async function getProviderQueue(orgId: string) {
  return prisma.case.findMany({
    where: { providerOrgId: orgId, state: { in: ACTIVE_STATES } },
    orderBy: [{ slaDueAt: "asc" }, { updatedAt: "desc" }],
    include: { claimantUser: { include: { org: true } }, evidence: true, notices: true },
  });
}

export async function getProviderCase(caseId: string, orgId: string) {
  return prisma.case.findFirst({
    where: { id: caseId, providerOrgId: orgId },
    include: {
      providerOrg: true,
      claimantUser: { include: { org: true } },
      evidence: { orderBy: { createdAt: "asc" } },
      notices: { orderBy: { createdAt: "desc" } },
      responses: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { sequence: "asc" } },
      mediations: { include: { settlements: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

function evidenceSummary(extracted: string | null): string {
  if (!extracted) return "";
  try {
    const ex = JSON.parse(extracted) as { summary?: string };
    return ex.summary ?? "";
  } catch {
    return "";
  }
}

/** Generate the AI resolution suggestion once, then reuse it (stored as a
 * provider-only ProviderResponse of kind "ai_suggestion"). */
export async function getOrCreateSuggestion(
  caseId: string,
  orgId: string
): Promise<ResolutionSuggestion | null> {
  const c = await prisma.case.findFirst({
    where: { id: caseId, providerOrgId: orgId },
    include: { providerOrg: true, evidence: true },
  });
  if (!c) return null;

  const existing = await prisma.providerResponse.findFirst({
    where: { caseId, kind: "ai_suggestion" },
  });
  if (existing?.message) {
    try {
      return JSON.parse(existing.message) as ResolutionSuggestion;
    } catch {
      /* regenerate below */
    }
  }

  const suggestion = await suggestResolution({
    claimType: c.claimType,
    narrative: c.narrative,
    amountTnd: millimesToTnd(c.amountMillimes),
    providerName: c.providerOrg.name,
    evidence: c.evidence.map((e) => ({ kind: e.kind, summary: evidenceSummary(e.extracted) })),
  });

  await prisma.providerResponse.create({
    data: {
      caseId,
      kind: "ai_suggestion",
      message: JSON.stringify(suggestion),
      remedyType: suggestion.suggestedRemedyType,
    },
  });
  return suggestion;
}

async function notifyClaimant(caseId: string, claimantUserId: string, type: string, caseNumber: string) {
  await prisma.notification.create({
    data: {
      userId: claimantUserId,
      caseId,
      type,
      messageKey: `notif.${type}`,
      params: JSON.stringify({ caseNumber }),
    },
  });
}

export async function providerRespond(input: {
  caseId: string;
  agentId: string;
  orgId: string;
  kind: "acknowledge" | "request_info" | "contest" | "propose_remedy";
  message?: string;
  remedyType?: string;
  amountMillimes?: number;
}) {
  const c = await prisma.case.findFirst({
    where: { id: input.caseId, providerOrgId: input.orgId },
  });
  if (!c) throw new Error("case_not_found");
  const state = c.state as CaseState;
  if (!["notice_sent", "provider_review", "resolution_proposed"].includes(state)) {
    throw new Error("case_not_actionable");
  }

  const toReview = async () => {
    if (state === "notice_sent") {
      await prisma.case.update({
        where: { id: c.id },
        data: { state: "provider_review", version: { increment: 1 } },
      });
    }
  };

  if (input.kind === "acknowledge") {
    await prisma.providerResponse.create({
      data: { caseId: c.id, actorUserId: input.agentId, kind: "acknowledgement", message: input.message ?? null },
    });
    await toReview();
    await recordEvent(c.id, "provider_acknowledged", { actor: input.agentId });
    await notifyClaimant(c.id, c.claimantUserId, "provider_acknowledged", c.caseNumber);
  } else if (input.kind === "request_info") {
    await prisma.providerResponse.create({
      data: { caseId: c.id, actorUserId: input.agentId, kind: "info_request", message: input.message ?? null },
    });
    await toReview();
    await recordEvent(c.id, "provider_requested_info", { actor: input.agentId, payload: { message: input.message } });
    await notifyClaimant(c.id, c.claimantUserId, "provider_requested_info", c.caseNumber);
  } else if (input.kind === "contest") {
    await prisma.providerResponse.create({
      data: { caseId: c.id, actorUserId: input.agentId, kind: "contest", message: input.message ?? null },
    });
    await toReview();
    await recordEvent(c.id, "provider_contested", { actor: input.agentId, payload: { message: input.message } });
    await notifyClaimant(c.id, c.claimantUserId, "provider_contested", c.caseNumber);
  } else if (input.kind === "propose_remedy") {
    await prisma.providerResponse.create({
      data: {
        caseId: c.id,
        actorUserId: input.agentId,
        kind: "remedy_proposal",
        message: input.message ?? null,
        remedyType: input.remedyType ?? "correct_bill",
        amountMillimes: input.amountMillimes ?? null,
        claimantDisposition: "pending",
      },
    });
    await prisma.case.update({
      where: { id: c.id },
      data: { state: "resolution_proposed", version: { increment: 1 } },
    });
    await recordEvent(c.id, "provider_proposed_remedy", {
      actor: input.agentId,
      payload: { remedyType: input.remedyType, amountMillimes: input.amountMillimes },
    });
    await notifyClaimant(c.id, c.claimantUserId, "remedy_proposed", c.caseNumber);
  }
}
