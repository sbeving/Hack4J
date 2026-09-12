import "server-only";
import { prisma } from "@/lib/db";
import { classifyClaim, extractEvidence } from "@/lib/ai/tasks";
import { recordEvent } from "@/lib/domain/events";
import { anchor } from "@/lib/ledger";
import { saveFile } from "@/lib/storage";
import { makeCaseNumber } from "@/lib/ids";
import { CLAIM_TYPES, type ClaimType, type Priority } from "@/lib/domain/constants";

function guessKind(mime: string): string {
  if (mime === "application/pdf") return "bill";
  if (mime.startsWith("image/")) return "photo";
  return "other";
}

export async function createClaim(input: {
  userId: string;
  providerOrgId: string;
  claimType?: ClaimType | "auto";
  narrative: string;
  amountMillimes: number;
  reference?: string;
  requestedRemedy?: string;
}) {
  const provider = await prisma.organization.findUnique({
    where: { id: input.providerOrgId },
  });
  if (!provider || provider.kind !== "provider") {
    throw new Error("invalid_provider");
  }

  // Accept an explicit claim type only if it is a known value; otherwise classify.
  let claimType: ClaimType | undefined =
    input.claimType && input.claimType !== "auto" && CLAIM_TYPES.includes(input.claimType as ClaimType)
      ? (input.claimType as ClaimType)
      : undefined;
  let priority: Priority = "normal";
  let classificationSource = "manual";
  let rationale = "";

  if (!claimType) {
    const c = await classifyClaim({
      narrative: input.narrative,
      providerName: provider?.name,
    });
    claimType = c.claimType;
    priority = c.priority;
    classificationSource = c.source;
    rationale = c.rationale;
  }

  const count = await prisma.case.count();
  const created = await prisma.case.create({
    data: {
      caseNumber: makeCaseNumber({ demo: true, seq: count + 1 }),
      claimType,
      claimantUserId: input.userId,
      providerOrgId: input.providerOrgId,
      amountMillimes: Math.max(0, Math.floor(input.amountMillimes || 0)),
      reference: input.reference,
      narrative: input.narrative,
      requestedRemedy: input.requestedRemedy,
      priority,
      state: "draft",
    },
  });

  await recordEvent(created.id, "created", {
    actor: input.userId,
    payload: { claimType, priority, classificationSource, rationale },
  });

  return created;
}

export async function addEvidence(input: {
  caseId: string;
  userId: string;
  filename: string;
  mime: string;
  buffer: Buffer;
}) {
  const stored = await saveFile(input.caseId, input.buffer, input.mime);
  const base64 =
    input.mime.startsWith("image/") || input.mime === "application/pdf"
      ? input.buffer.toString("base64")
      : undefined;
  const text = input.mime.startsWith("text/")
    ? input.buffer.toString("utf-8")
    : undefined;

  const kind = guessKind(input.mime);
  const extraction = await extractEvidence({
    kind,
    mime: input.mime,
    base64,
    text,
  });

  const ev = await prisma.evidence.create({
    data: {
      caseId: input.caseId,
      submittedByUserId: input.userId,
      kind: extraction.documentKind || kind,
      filename: input.filename,
      mime: input.mime,
      byteCount: stored.byteCount,
      storageKey: stored.storageKey,
      contentHash: stored.contentHash,
      extracted: JSON.stringify(extraction),
      reviewState: "needs_confirmation",
      verified: true,
    },
  });

  await anchor({
    caseId: input.caseId,
    subjectType: "evidence",
    subjectId: ev.id,
    digest: stored.contentHash,
  });
  await recordEvent(input.caseId, "evidence_added", {
    actor: input.userId,
    payload: {
      evidenceId: ev.id,
      contentHash: stored.contentHash,
      kind: ev.kind,
      extractionSource: extraction.source,
    },
  });

  return ev;
}

export async function submitClaim(caseId: string, userId: string) {
  const c = await prisma.case.findFirst({
    where: { id: caseId, claimantUserId: userId },
  });
  if (!c) throw new Error("case_not_found");
  if (c.state !== "draft") return c;

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: { state: "filed", version: { increment: 1 } },
  });
  await recordEvent(caseId, "filed", { actor: userId });
  return updated;
}

export async function getClaimantCases(userId: string) {
  return prisma.case.findMany({
    where: { claimantUserId: userId },
    orderBy: { updatedAt: "desc" },
    include: { providerOrg: true, evidence: true, notices: true },
  });
}

export async function getCaseForClaimant(caseId: string, userId: string) {
  return prisma.case.findFirst({
    where: { id: caseId, claimantUserId: userId },
    include: {
      providerOrg: true,
      claimantUser: true,
      evidence: { orderBy: { createdAt: "asc" } },
      notices: { orderBy: { createdAt: "desc" } },
      responses: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { sequence: "asc" } },
      dossiers: { orderBy: { createdAt: "desc" } },
      mediations: { include: { settlements: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } },
      anchors: { orderBy: { submittedAt: "asc" } },
    },
  });
}
