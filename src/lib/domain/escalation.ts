import "server-only";
import { keccak256, concat } from "viem";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/domain/events";
import { anchor } from "@/lib/ledger";
import { verifyMany } from "@/lib/integrity";
import { keccakOfString } from "@/lib/hash";
import { saveArtifact } from "@/lib/storage";
import { renderHtmlToPdf } from "@/lib/pdf/render";
import { summarizeForDossier } from "@/lib/ai/dossier-tasks";
import { buildDossierHtml, buildDossierJson, type DossierSnapshot } from "@/lib/dossier/build";
import { millimesToTnd } from "@/lib/money";
import { uuid } from "@/lib/ids";
import { CLAIM_TYPE_LABEL, label } from "@/lib/domain/constants";

const DOSSIER_DOMAIN = keccakOfString("SULHA_DOSSIER_V1");
const ESCALATABLE = ["notice_sent", "provider_review", "resolution_proposed"];

export type Eligibility = {
  eligible: boolean;
  reason: string;
  overdue: boolean;
  contested: boolean;
  declined: boolean;
};

export async function escalationEligibility(caseId: string, userId: string): Promise<Eligibility> {
  const none: Eligibility = { eligible: false, reason: "", overdue: false, contested: false, declined: false };
  const c = await prisma.case.findFirst({
    where: { id: caseId, claimantUserId: userId },
    include: { responses: true },
  });
  if (!c || !ESCALATABLE.includes(c.state)) return none;

  const overdue = !!c.slaDueAt && new Date(c.slaDueAt).getTime() <= Date.now();
  const contested = c.responses.some((r) => r.kind === "contest");
  const declined = c.responses.some((r) => r.kind === "remedy_proposal" && r.claimantDisposition === "declined");
  const reason = contested
    ? "Contestation du fournisseur"
    : declined
      ? "Proposition de résolution refusée"
      : overdue
        ? "Délai de réponse (SLA) dépassé"
        : "";
  return { eligible: overdue || contested || declined, reason, overdue, contested, declined };
}

export async function escalateAndFileDossier(caseId: string, userId: string) {
  const elig = await escalationEligibility(caseId, userId);
  if (!elig.eligible) throw new Error("escalation_not_eligible");

  const institution = await prisma.organization.findFirst({ where: { kind: "institution" } });
  if (!institution) throw new Error("no_institution_configured");

  // Freeze inputs: mark escalation_pending.
  await prisma.case.update({
    where: { id: caseId },
    data: { state: "escalation_pending", escalationReason: elig.reason, version: { increment: 1 } },
  });
  await recordEvent(caseId, "escalation_requested", { actor: userId, payload: { reason: elig.reason } });

  // Assemble the snapshot.
  const c = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      claimantUser: { include: { org: true } },
      providerOrg: true,
      evidence: { orderBy: { createdAt: "asc" } },
      notices: { orderBy: { createdAt: "desc" } },
      responses: { orderBy: { createdAt: "asc" }, where: { NOT: { kind: "ai_suggestion" } } },
      events: { orderBy: { sequence: "asc" } },
      anchors: true,
    },
  });

  const integrity = await verifyMany(c.evidence);
  const anchorByEvidence = new Map(
    c.anchors.filter((a) => a.subjectType === "evidence").map((a) => [a.subjectId, a.anchorId])
  );

  const summary = await summarizeForDossier({
    claimType: c.claimType,
    narrative: c.narrative,
    amountTnd: millimesToTnd(c.amountMillimes),
    providerName: c.providerOrg.name,
    evidence: c.evidence.map((e) => ({ kind: e.kind, summary: exSummary(e.extracted) })),
    responses: c.responses.map((r) => ({ kind: r.kind, message: r.message })),
  });

  const sentNotice = c.notices.find((n) => n.status === "sent") ?? null;
  const snapshotId = uuid();
  const generatedAt = new Date().toISOString();
  const throughEventSeq = c.events.at(-1)?.sequence ?? 0;

  const snapshot: DossierSnapshot = {
    caseNumber: c.caseNumber,
    snapshotId,
    generatedAt,
    throughEventSeq,
    demo: c.mode === "demo",
    claimant: { name: c.claimantUser.name, org: c.claimantUser.org?.name ?? "—" },
    provider: { name: c.providerOrg.name },
    institution: institution.name,
    claimType: c.claimType,
    claimTypeLabel: label(CLAIM_TYPE_LABEL, c.claimType, "fr"),
    amountMillimes: c.amountMillimes,
    reference: c.reference,
    requestedRemedy: c.requestedRemedy,
    narrative: c.narrative,
    escalationReason: elig.reason,
    timeline: c.events.map((e) => ({ seq: e.sequence, type: e.type, actor: e.actor, ts: e.ts.toISOString() })),
    evidence: c.evidence.map((e, i) => ({
      index: i + 1,
      id: e.id,
      filename: e.filename,
      kind: e.kind,
      mime: e.mime,
      byteCount: e.byteCount,
      contentHash: e.contentHash,
      integrity: integrity.get(e.id) ?? "unavailable",
      anchorId: anchorByEvidence.get(e.id) ?? null,
      summary: exSummary(e.extracted),
    })),
    notice: sentNotice
      ? {
          version: sentNotice.version,
          sentAt: sentNotice.sentAt?.toISOString() ?? null,
          deadlineDays: sentNotice.deadlineDays,
          contentHash: sentNotice.contentHash,
          simulated: true,
        }
      : null,
    responses: c.responses.map((r) => ({
      kind: r.kind,
      message: r.message,
      remedyType: r.remedyType,
      amountMillimes: r.amountMillimes,
      claimantDisposition: r.claimantDisposition,
      createdAt: r.createdAt.toISOString(),
    })),
    summary,
  };

  // Render artifacts (PDF human + JSON machine, same snapshot).
  const pdf = await renderHtmlToPdf(buildDossierHtml(snapshot));
  const jsonBytes = Buffer.from(JSON.stringify(buildDossierJson(snapshot), null, 2), "utf-8");

  const version = (await prisma.dossier.count({ where: { caseId } })) + 1;
  const pdfStored = await saveArtifact(`${caseId}/dossier-v${version}.pdf`, pdf);
  const jsonStored = await saveArtifact(`${caseId}/dossier-v${version}.json`, jsonBytes);

  // Bundle receipt hash (avoids circular hashing): domain || pdfDigest || jsonDigest.
  const bundleHash = keccak256(concat([DOSSIER_DOMAIN, pdfStored.contentHash, jsonStored.contentHash]));

  const manifest = snapshot.evidence.map((e) => ({
    index: e.index,
    evidenceId: e.id,
    contentHash: e.contentHash,
    integrity: e.integrity,
    anchorId: e.anchorId,
  }));

  const dossier = await prisma.dossier.create({
    data: {
      caseId,
      version,
      snapshotId,
      pdfKey: pdfStored.storageKey,
      jsonKey: jsonStored.storageKey,
      summary: summary.neutralSummary,
      manifest: JSON.stringify(manifest),
      bundleHash,
      throughEventSeq,
      filedAt: new Date(),
    },
  });

  await anchor({ caseId, subjectType: "dossier", subjectId: dossier.id, digest: bundleHash });

  // Assign + grant the institution atomically with the state transition.
  await prisma.case.update({
    where: { id: caseId },
    data: { state: "dossier_filed", institutionOrgId: institution.id, version: { increment: 1 } },
  });
  await recordEvent(caseId, "dossier_filed", {
    actor: "system",
    payload: { dossierId: dossier.id, version, bundleHash, institution: institution.id },
  });

  // Notify the institution's resolvers.
  const resolvers = await prisma.user.findMany({
    where: { orgId: institution.id, role: "resolver" },
    select: { id: true },
  });
  if (resolvers.length) {
    await prisma.notification.createMany({
      data: resolvers.map((r) => ({
        userId: r.id,
        caseId,
        type: "dossier_received",
        messageKey: "notif.dossier_received",
        params: JSON.stringify({ caseNumber: c.caseNumber }),
      })),
    });
  }

  return dossier;
}

function exSummary(extracted: string | null): string {
  if (!extracted) return "";
  try {
    return (JSON.parse(extracted) as { summary?: string }).summary ?? "";
  } catch {
    return "";
  }
}
