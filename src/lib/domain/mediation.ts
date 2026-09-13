import "server-only";
import { prisma } from "@/lib/db";
import { millimesToTnd, tndToMillimes } from "@/lib/money";
import {
  mediateNegotiation,
  mediatorChatReply,
  type MediationBrief,
} from "@/lib/ai/mediation-tasks";
import { summarizeForDossier, type DossierSummary } from "@/lib/ai/dossier-tasks";

export type Party = "claimant" | "provider";

// Rows we cache on the case but never show as real "exchanges".
const AI_KINDS = ["ai_suggestion", "ai_mediation"];

function evidenceSummary(extracted: string | null): string {
  if (!extracted) return "";
  try {
    return (JSON.parse(extracted) as { summary?: string }).summary ?? "";
  } catch {
    return "";
  }
}

type StoredBrief = { brief: MediationBrief; fingerprint: string };

/**
 * Generate the shared neutral mediation brief, cached on the case as a
 * ProviderResponse of kind "ai_mediation" (mirrors getOrCreateSuggestion).
 * A fingerprint (case version + number of real exchanges) invalidates the
 * cache so the brief follows the negotiation as it evolves.
 * Not org-scoped — the caller has already checked access.
 */
export async function getOrCreateMediationBrief(
  caseId: string
): Promise<MediationBrief | null> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { providerOrg: true, evidence: true, responses: { orderBy: { createdAt: "asc" } } },
  });
  if (!c) return null;

  const exchanges = c.responses.filter((r) => !AI_KINDS.includes(r.kind));
  const fingerprint = `${c.version}:${exchanges.length}`;

  const existing = await prisma.providerResponse.findFirst({
    where: { caseId, kind: "ai_mediation" },
  });
  if (existing?.message) {
    try {
      const stored = JSON.parse(existing.message) as StoredBrief;
      if (
        stored.fingerprint === fingerprint &&
        stored.brief &&
        stored.brief.source !== "fallback"
      ) {
        return stored.brief;
      }
    } catch {
      /* regenerate below */
    }
  }

  const brief = await mediateNegotiation({
    claimType: c.claimType,
    narrative: c.narrative,
    amountTnd: millimesToTnd(c.amountMillimes),
    providerName: c.providerOrg.name,
    requestedRemedy: c.requestedRemedy,
    evidence: c.evidence.map((e) => ({ kind: e.kind, summary: evidenceSummary(e.extracted) })),
    exchanges: exchanges.map((r) => ({
      kind: r.kind,
      message: r.message,
      remedyType: r.remedyType,
      amountTnd: r.amountMillimes != null ? millimesToTnd(r.amountMillimes) : null,
      disposition: r.claimantDisposition,
    })),
  });

  const payload = JSON.stringify({ brief, fingerprint } satisfies StoredBrief);
  const compromiseMillimes =
    brief.suggestedCompromise.amountTnd != null
      ? tndToMillimes(brief.suggestedCompromise.amountTnd)
      : null;

  if (existing) {
    await prisma.providerResponse.update({
      where: { id: existing.id },
      data: { message: payload, remedyType: brief.suggestedCompromise.remedyType, amountMillimes: compromiseMillimes },
    });
  } else {
    await prisma.providerResponse.create({
      data: {
        caseId,
        kind: "ai_mediation",
        message: payload,
        remedyType: brief.suggestedCompromise.remedyType,
        amountMillimes: compromiseMillimes,
      },
    });
  }
  return brief;
}

// ── Per-party chat thread ────────────────────────────────────────────────────

export async function getMediationMessages(caseId: string, party: Party) {
  return prisma.mediationMessage.findMany({
    where: { caseId, party },
    orderBy: { createdAt: "asc" },
  });
}

/** Store the party's message, get the AI reply, store it, return both. */
export async function postMediationMessage(caseId: string, party: Party, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { providerOrg: true },
  });
  if (!c) throw new Error("case_not_found");

  const history = await prisma.mediationMessage.findMany({
    where: { caseId, party },
    orderBy: { createdAt: "asc" },
    take: 16,
  });

  const userTurn = await prisma.mediationMessage.create({
    data: { caseId, party, role: "user", text: trimmed },
  });

  const brief = await getOrCreateMediationBrief(caseId);

  const reply = await mediatorChatReply({
    party,
    history: history.map((m) => ({ role: m.role as "user" | "assistant", text: m.text })),
    userMessage: trimmed,
    context: {
      claimType: c.claimType,
      narrative: c.narrative,
      amountTnd: millimesToTnd(c.amountMillimes),
      providerName: c.providerOrg.name,
      brief,
    },
  });

  const aiTurn = await prisma.mediationMessage.create({
    data: { caseId, party, role: "assistant", text: reply.reply, source: reply.source },
  });

  return { userTurn, aiTurn };
}

// ── Full mediation report (AI summary + on-chain tracking log) ────────────────

export type MediationReport = {
  summary: DossierSummary;
  events: { id: string; sequence: number; type: string; actor: string | null; ts: Date }[];
  anchors: {
    subjectId: string;
    subjectType: string;
    txHash: string | null;
    blockNumber: number | null;
    status: string;
    adapter: string;
  }[];
};

/** Build the report a party can hand to a human reviewer: a neutral AI summary
 * (reuses summarizeForDossier) plus the hash-chained, ledger-anchored tracking
 * log. No state change — this is a read. */
export async function buildMediationReport(caseId: string): Promise<MediationReport | null> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      providerOrg: true,
      evidence: { orderBy: { createdAt: "asc" } },
      responses: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { sequence: "asc" } },
      anchors: { orderBy: { submittedAt: "asc" } },
    },
  });
  if (!c) return null;

  const exchanges = c.responses.filter((r) => !AI_KINDS.includes(r.kind));
  const summary = await summarizeForDossier({
    claimType: c.claimType,
    narrative: c.narrative,
    amountTnd: millimesToTnd(c.amountMillimes),
    providerName: c.providerOrg.name,
    evidence: c.evidence.map((e) => ({ kind: e.kind, summary: evidenceSummary(e.extracted) })),
    responses: exchanges.map((r) => ({ kind: r.kind, message: r.message })),
  });

  return {
    summary,
    events: c.events.map((e) => ({
      id: e.id,
      sequence: e.sequence,
      type: e.type,
      actor: e.actor,
      ts: e.ts,
    })),
    anchors: c.anchors.map((a) => ({
      subjectId: a.subjectId,
      subjectType: a.subjectType,
      txHash: a.txHash,
      blockNumber: a.blockNumber,
      status: a.status,
      adapter: a.adapter,
    })),
  };
}
