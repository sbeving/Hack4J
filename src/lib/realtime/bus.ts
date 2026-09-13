import "server-only";
import { EventEmitter } from "node:events";

// In-process fan-out so an open SSE stream wakes the instant a case changes,
// instead of waiting for its next database check. Single Next server = single
// bus; it is a latency optimisation, never the source of truth (streams still
// re-read the pulse from the database before pushing).
// Kept on globalThis so dev hot-reload doesn't strand subscribers on an old copy.

const CHANGE = "case-change";

const globalForBus = globalThis as unknown as { sulhaBus?: EventEmitter };
const bus =
  globalForBus.sulhaBus ??
  (() => {
    const e = new EventEmitter();
    e.setMaxListeners(0); // one listener per open stream
    return e;
  })();
globalForBus.sulhaBus = bus;

/** Announce that a case changed. Safe to call from any server code path. */
export function publishCaseChange(caseId: string): void {
  bus.emit(CHANGE, caseId);
}

/** Listen for changes to `caseId`, or to any case when it is null. */
export function subscribeCaseChanges(
  caseId: string | null,
  onChange: () => void
): () => void {
  const handler = (changed: string) => {
    if (caseId === null || changed === caseId) onChange();
  };
  bus.on(CHANGE, handler);
  return () => bus.off(CHANGE, handler);
}
