import "server-only";
import { readFile } from "@/lib/storage";
import { keccakOfBuffer } from "@/lib/hash";

export type IntegrityStatus = "matched" | "mismatch" | "unavailable";

/** Recompute the stored file's keccak256 and compare to the registered hash.
 * This is the real integrity check — a tampered file yields "mismatch". */
export async function verifyEvidenceIntegrity(ev: {
  storageKey: string;
  contentHash: string;
}): Promise<{ status: IntegrityStatus; recomputed: string | null }> {
  try {
    const buf = await readFile(ev.storageKey);
    const recomputed = keccakOfBuffer(buf);
    return {
      status: recomputed.toLowerCase() === ev.contentHash.toLowerCase() ? "matched" : "mismatch",
      recomputed,
    };
  } catch {
    return { status: "unavailable", recomputed: null };
  }
}

export async function verifyMany(
  list: { id: string; storageKey: string; contentHash: string }[]
): Promise<Map<string, IntegrityStatus>> {
  const entries = await Promise.all(
    list.map(async (e) => [e.id, (await verifyEvidenceIntegrity(e)).status] as const)
  );
  return new Map(entries);
}
