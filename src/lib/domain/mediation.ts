import "server-only";
import { prisma } from "@/lib/db";
import { millimesToTnd, tndToMillimes } from "@/lib/money";
import {
  mediateNegotiation,
  mediatorChatReply,
  type MediationBrief,
} from "@/lib/ai/mediation-tasks";
import { summarizeForDossier, type DossierSummary } from "@/lib/ai/dossier-tasks";
import { isAiResponse } from "@/lib/domain/constants";

export type Party = "claimant" | "provider";

function evidenceSummary(extracted: string | null): string {
  if (!extracted) return "";
  try {
    return (JSON.parse(extracted) as { summary?: string }).summary ?? "";
  } catch {
    return "";
  }
}

// ── AI payload cache ─────────────────────────────────────────────────────────
// AI output is cached on the case as a ProviderResponse row (see AI_RESPONSE_KINDS)
// keyed by a fingerprint: case version + number of real exchanges. The model is
// therefore called once per actual move in the negotiation, not once per render —
// which is what keeps a page refresh sub-second.

type CachedAi<T> = { value: T; fingerprint: string };

/** The negotiation state the AI output is valid for. */
export function mediationFingerprint(c: {
  version: number;
  responses: { kind: string }[];
}): string {
  return `${c.version}:${c.responses.filter((r) => !isAiResponse(r.kind)).length}`;
}

async function readAiCache<T extends { source: string }>(
  caseId: string,
  kind: string,
  fingerprint: string | null
): Promise<T | null> {
  const row = await prisma.providerResponse.findFirst({ where: { caseId, kind } });
  if (!row?.message) return null;
  try {
    const stored = JSON.parse(row.message) as CachedAi<T>;
    if (!stored.value) return null;
    // A fallback payload means the model failed — always worth retrying.
    if (stored.value.source === "fallback") return null;
    if (fingerprint !== null && stored.fingerprint !== fingerprint) return null;
    return stored.value;
  } catch {
    return null;
  }
}

async function writeAiCache<T>(
  caseId: string,
  kind: string,
  fingerprint: string,
  value: T,
  columns?: { remedyType?: string | null; amountMillimes?: number | null }
): Promise<void> {
  const message = JSON.stringify({ value, fingerprint } satisfies CachedAi<T>);
  const row = await prisma.providerResponse.findFirst({
    where: { caseId, kind },
    select: { id: true },
  });
  if (row) {
    await prisma.providerResponse.update({ where: { id: row.id }, data: { message, ...columns } });
  } else {
    await prisma.providerResponse.create({ data: { caseId, kind, message, ...columns } });
  }
}

/** The cached brief without ever calling the model — for form defaults. */
export async function readMediationBrief(caseId: string): Promise<MediationBrief | null> {
  return readAiCache<MediationBrief>(caseId, "ai_mediation", null);
}

/**
 * The shared neutral mediation brief, regenerated only when the negotiation moves.
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

  const exchanges = c.responses.filter((r) => !isAiResponse(r.kind));
  const fingerprint = mediationFingerprint(c);

  const cached = await readAiCache<MediationBrief>(caseId, "ai_mediation", fingerprint);
  if (cached) return cached;

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

  await writeAiCache(caseId, "ai_mediation", fingerprint, brief, {
    remedyType: brief.suggestedCompromise.remedyType,
    amountMillimes:
      brief.suggestedCompromise.amountTnd != null
        ? tndToMillimes(brief.suggestedCompromise.amountTnd)
        : null,
  });
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

  const exchanges = c.responses.filter((r) => !isAiResponse(r.kind));
  const fingerprint = mediationFingerprint(c);

  let summary = await readAiCache<DossierSummary>(caseId, "ai_report", fingerprint);
  if (!summary) {
    summary = await summarizeForDossier({
      claimType: c.claimType,
      narrative: c.narrative,
      amountTnd: millimesToTnd(c.amountMillimes),
      providerName: c.providerOrg.name,
      evidence: c.evidence.map((e) => ({ kind: e.kind, summary: evidenceSummary(e.extracted) })),
      responses: exchanges.map((r) => ({ kind: r.kind, message: r.message })),
    });
    await writeAiCache(caseId, "ai_report", fingerprint, summary);
  }

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
