import { randomBytes, randomUUID } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function shortCode(len = 5): string {
  const b = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[b[i] % ALPHABET.length];
  return out;
}

/** Human-facing, non-secret case number, e.g. SLH-2026-7Q4KP or SLH-DEMO-001. */
export function makeCaseNumber(opts?: { demo?: boolean; seq?: number }): string {
  if (opts?.demo && typeof opts.seq === "number") {
    return `SLH-DEMO-${String(opts.seq).padStart(3, "0")}`;
  }
  const year = new Date().getFullYear();
  return `SLH-${year}-${shortCode(5)}`;
}

/** Opaque random 32-byte id used for ledger anchors (never the case number). */
export function makeAnchorId(): `0x${string}` {
  return `0x${randomBytes(32).toString("hex")}`;
}

/** Random 32-byte salt (hex) for salted ledger commitments. */
export function makeSalt(): `0x${string}` {
  return `0x${randomBytes(32).toString("hex")}`;
}

export function uuid(): string {
  return randomUUID();
}
