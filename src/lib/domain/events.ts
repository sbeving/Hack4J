import "server-only";
import { prisma } from "@/lib/db";
import { keccakOfString } from "@/lib/hash";
import { canonicalJson } from "@/lib/canonical";
import { anchor } from "@/lib/ledger";

export type EventVisibility =
  | "shared"
  | "claimant_private"
  | "provider_private"
  | "institution_private";

/**
 * Append a sequenced, hash-chained event to a case. The payload hash + previous
 * hash make later tampering of an anchored event detectable.
 */
export async function recordEvent(
  caseId: string,
  type: string,
  opts?: {
    actor?: string;
    payload?: unknown;
    visibility?: EventVisibility;
  }
) {
  const last = await prisma.caseEvent.findFirst({
    where: { caseId },
    orderBy: { sequence: "desc" },
  });
  const sequence = (last?.sequence ?? 0) + 1;
  const payloadStr = opts?.payload !== undefined ? canonicalJson(opts.payload) : null;
  const payloadHash = payloadStr ? keccakOfString(payloadStr) : null;

  const ev = await prisma.caseEvent.create({
    data: {
      caseId,
      sequence,
      type,
      actor: opts?.actor ?? null,
      visibility: opts?.visibility ?? "shared",
      payload: payloadStr,
      payloadHash,
      prevHash: last?.payloadHash ?? null,
    },
  });

  // Anchor the event's commitment to the append-only ledger.
  const digest = payloadHash ?? keccakOfString(canonicalJson({ caseId, sequence, type }));
  await anchor({ caseId, subjectType: "event", subjectId: ev.id, digest });

  return ev;
}
