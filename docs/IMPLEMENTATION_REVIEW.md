# Sulha — implementation critique and next-step assessment

**Reviewed:** 12 September 2026. **Committed baseline:** `c1911e5`; review includes substantial uncommitted Claude work.  
**Runtime-tested snapshot:** 17:52:55 UTC / 18:52:55 Tunis. **Later notice/PDF source review:** 18:08:18 UTC / 19:08:18 Tunis.  
**Continuation instructions:** [CLAUDE_NEXT_PROMPT.md](CLAUDE_NEXT_PROMPT.md). **Verification record:** [review-evidence/2026-09-12.json](review-evidence/2026-09-12.json).

## Assessment

**Continue the existing implementation. The stack and visual foundation are reasonable; correctness and complete user journeys are the next priority.** Claude has moved beyond a scaffold: claimant intake, case persistence, evidence storage/extraction, confirmation and filing are connected. A later update adds notice generation, a PDF download route, simulated delivery, notifications and an SLA countdown. Provider handling, escalation, institutional mediation and meaningful analytics remain the next major slices at the reviewed cutoff.

The application is not yet ready to demonstrate trustworthy end-to-end dispute handling. Several screens imply guarantees that their backend does not establish: “hash verified,” reviewed submission, immutable notice versions and reliable deadlines. Fixing those contracts now is less expensive than carrying them into dossiers and settlements.

The earlier technical PRD proposed FastAPI/PostgreSQL. The repository now explicitly locks **Next.js 16, React 19, TypeScript, Tailwind 4, Prisma 6 and SQLite**. Preserve that decision. Port the PRD's behavioral requirements to this stack; do not introduce a second backend or PostgreSQL-only locking patterns.

## What Claude has implemented

| Area | Evidence-supported status | Remaining work |
|---|---|---|
| Application shell | Four role workspaces, database-backed demo picker, role redirects, logout, FR/AR locale switch and RTL styling | Stronger session boundary, mobile identity, accessible navigation and error surfaces |
| Claim intake | Provider/category/amount/reference/remedy form, saved draft, claimant list and scoped detail page; browser speech-recognition hook in source | Strict server validation, editable/resumable facts, confirmed classification, dependable voice failure/cleanup behavior |
| Evidence | Private local file writes, upload digest, AI/manual extraction, evidence rows and a confirmation action | Actual stored-byte verification, preview/download, corrections, revisions, content checks, count/total limits, independent processing status |
| Case workflow | Draft creation and filing; existing actions derive the claimant from the session and check ownership | Submission completeness, transactional events, expected versions, idempotency, lifecycle guards and robust event digests |
| Notice/PDF | **Later source-only update:** Puppeteer renderer, Noto fonts, bilingual template, PDF route, facts snapshot/version/hash, simulated receipt and notifications | Runtime verification; approved immutable version, explicit sharing, single SLA instance, stable countdown and retry recovery |
| Provider workspace | Protected shell | Real queue, case detail, requests, contest, proposed remedy, claimant decision and party settlement acknowledgement |
| Resolver workspace | Protected shell and schema records | Escalation dossier, assigned queue, scoped APIs, scheduling, terms, both-party acknowledgement and final PV |
| Ledger | Digest/ID utilities and receipt schema | Working adapter, verification and event anchoring; simulation must not be described as on-chain |
| Analytics | Admin shell and planned metrics | Scoped event-derived counts, transparent Agency Benefit inputs and useful operations view |
| Quality/setup | Tested intake snapshot compiles; lint has two warnings | Automated regression suite, reproducible environment template, safe seeding and runtime prerequisites |

The initial missing `/claimant/new` route was fixed during this review. Puppeteer/PDF generation was also added. Those early observations are **not current findings**. Later changes were read from a separate snapshot rather than assumed to inherit the earlier passing build.

## Findings to address first

Priority describes implementation order. P1 means fix before building dependent behavior or presenting the claim as reliable. P2 is important follow-up. This is a review of a synthetic hackathon application, not a report of attacks against a deployed service.

### R01 — Evidence is marked verified without verifying stored bytes · P1 · reproduced

[cases.ts:93](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/cases.ts:93) saves `verified: true` at upload. The reviewed [case detail:158](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/app/claimant/cases/[id]/page.tsx:158) prints a green “hash vérifié” badge without consuming a verification result.

In the isolated review copy, an evidence file was uploaded, its stored bytes were deliberately changed, and the case page still returned HTTP 200 with the verified badge. This is a false integrity assurance, even though the original upload digest itself was calculated correctly.

**Fix:** show “Hash recorded” initially. Add an authorized verification operation that rereads bytes, recomputes the digest and returns `matched`, `mismatch` or `unavailable`, with a check timestamp. Keep extraction review, byte integrity and ledger inclusion as separate statuses. Hash matching does not establish authenticity.

### R02 — Invalid input persists and can break the claimant workspace · P1 · reproduced

[claim-actions.ts:14](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/claim-actions.ts:14) casts category text instead of validating it and uses `parseFloat` for money. [cases.ts:24](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/cases.ts:24) does not require the selected organization to be a provider.

A service-level probe persisted an unknown category, an institution as counterparty and a negative amount. Opening that case returned HTTP 500. The same invalid category also broke the claimant list, which indexes category labels without handling unknown values. The probe called the domain service; the source shows the exposed action supplies those inputs without the missing validation.

**Fix:** strict Zod schemas at action/service boundaries; distinguish draft from submission validation; enforce provider kind and category/remedy enums. Parse decimal strings into bounded integer millimes, rejecting invalid syntax and excess precision. Protect rendering against invalid legacy values without silently blessing them as valid categories.

### R03 — Filing bypasses meaningful review, and corrections are not implemented · P1 · reproduced/source

[cases.ts:122](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/cases.ts:122) checks ownership/state, then files the claim. The browser successfully filed a new claim with zero evidence and no completeness review. [claim-actions.ts:61](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/claim-actions.ts:61) confirms evidence by flipping a flag; it accepts no corrected values or reviewed revision.

The UI displays only part of the extraction, has no original preview/download and cannot edit the draft's material facts or classification. A claimant therefore cannot reliably perform the review the product promises.

**Fix:** define explicit submission prerequisites. If evidence is optional for a category, record that rule and the claimant's explanation; never imply it was checked. Require confirmation of all material facts and included evidence. Add source-linked editable suggestions and versioned confirmation before notice generation. Preserve the current separation between the entered disputed amount and extracted invoice totals.

### R04 — State changes, event order and audit hashes are not atomic · P1 · source plus filing probe

[cases.ts:46](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/cases.ts:46) and subsequent actions commit business rows separately from `recordEvent`. [events.ts:25](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/events.ts:25) allocates `max(sequence)+1` outside a shared transaction. A later event failure can leave a committed state without its audit record; retrying a filed case returns early and cannot repair the missing event.

The event digest hashes only the payload, excluding actor, type, time, sequence and previous-link metadata. The filing probe produced `payloadHash: null`; the next link cannot establish a continuous event chain. Interactive case numbers also use `count()+1`, creating a concurrency collision risk.

**Fix:** use short Prisma transactions with conditional expected-version updates, a single event-sequence allocator and logical command idempotency. Hash a complete versioned event envelope, including the previous event digest, even for events with empty payloads. Use random display numbers with bounded collision retry or an atomic counter. These race failures were established by source analysis; a concurrency stress test was not run.

### R05 — Notice sending can reset the SLA and leave partial effects · P1 · later source-only review

[notice.ts:61](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/notice.ts:61) checks claimant ownership and association, but does not establish approved status, current facts/version, allowed case state or a frozen sharing set. Sending a second generated notice can reset the case's SLA/state. A notice is marked sent before the case/event/notification writes; retry then exits early if one of those later writes failed.

**Fix:** bind final confirmation to the exact PDF digest, facts revision, recipient and shared evidence. For simulated portal delivery, atomically record receipt, approved version, provider grant, one SLA instance, events and notifications. A retry must complete or return the same logical operation, never restart the clock. Keep future real delivery as a separately reconciled external effect.

### R06 — The notice download route shares unsent documents too early · P1 · later source-only review

[PDF route:20](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/app/api/notices/[noticeId]/pdf/route.ts:20) allows a matching provider to read a notice regardless of delivery status and gives every administrator content access. This differs from the agreed sharing boundary: claimant approval/accepted delivery grants provider access; admin access requires an explicit support grant.

**Fix:** central case and artifact authorization, with recipient/item grants and delivery-state checks. Reuse that policy for evidence, dossiers, settlement PDFs and future institutional APIs. No broad unauthenticated file disclosure or cross-claim IDOR was demonstrated in the reviewed claimant actions.

### R07 — Generated notice versions can collide and overwrite bytes · P1 · later source-only review

[notice.ts:37](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/notice.ts:37) uses `count()+1` and writes a predictable `notice-vN.pdf` path. [storage.ts:51](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/storage.ts:51) overwrites an existing artifact key. The schema has no unique notice `(caseId, version)` constraint.

**Fix:** reserve the document version under a transaction, enforce unique version keys and use unique write-once storage objects. Render outside the transaction, then publish only against the reserved input revision. Missing/conflicting files must produce a visible failed artifact, never silently replace a sent notice.

### R08 — AI blocks user requests and fallback behavior is overstated · P2 · source

[cases.ts:35](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/cases.ts:35) awaits classification before saving the draft. [cases.ts:76](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/cases.ts:76) saves bytes, awaits extraction, then creates the evidence row. Interrupted requests can leave orphaned files and no visible processing record.

[AI client:12](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/ai/client.ts:12) lacks an explicit timeout. SDK retries plus the outer catch-all JSON retry can multiply requests; the inspected SDK's default nonstreaming timeout is ten minutes. `AI_ENABLED=false` provides manual/heuristic results, not the recorded fixture replay promised by the build plan. The extraction schema also accepts an empty object through defaults.

**Fix:** save first, process through a persisted SQLite-compatible job mechanism, apply one bounded retry/timeout policy and preserve source/failure metadata. Separate unreadable, failed, manual, recorded and live results. Do not silently assign a model/heuristic suggestion as a confirmed fact. Live model availability and quality were not tested.

### R09 — The demo picker works, but its cookie is not a real session boundary · P2 for demo; blocker for real use · reproduced

[actions.ts:10](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/actions.ts:10) stores a predictable user ID directly in a cookie; [session.ts:34](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/session.ts:34) accepts it as identity. In the isolated server, `/admin` redirected without a cookie and returned 200 with `sulha_session=user-admin`, without a login exchange. The picker remained available with `DEMO_MODE=false`.

An intentionally open synthetic role picker is acceptable for a hackathon. It must be gated and accurately described, and its cookie must not be mistaken for authenticated identity when access tests or real data are introduced.

**Fix:** allowlist demo accounts behind demo mode, issue opaque random sessions with server-side expiry/revocation, and deny non-demo access until an actual authentication provider exists. Current role and claimant-ownership checks are useful and should be retained.

### R10 — Ordinary seeding destroys existing work · P1 before team/demo reuse · source

[seed.ts:6](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/prisma/seed.ts:6) deletes all case, evidence, document, event and user records, and `main()` always invokes it. README separately describes `db:seed` as seeding and `db:reset` as wiping.

**Fix:** make normal seeding idempotent with stable fixture upserts. Reserve deletion for a clearly named, explicitly guarded demo reset. Preserve unrelated cases and uploads. Add a second claimant/provider/institution fixture so authorization checks are meaningful. The original working database was not reseeded during this review.

### R11 — Some UI labels and timing contradict actual state · P2 · source/browser

- A fresh draft displays the first tracker stage as filed. Withdrawn/closed-unsettled cases share the normal final “settled” stage through [Tracker.tsx:11](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/components/Tracker.tsx:11) and the constants map.
- Manual classification is presented under an AI heading; show actual result provenance and confirmation state.
- [SlaCountdown.tsx:18](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/components/SlaCountdown.tsx:18) recalculates its server skew on every render, repeatedly resetting the interval baseline. Capture a stable baseline and reset only on an updated server timestamp.
- Forms have pending labels, but lack structured localized error results, field errors and recoverable retry guidance. Narrative/file controls need associated labels.
- Mobile identity disappears; the Arabic footer remains French. Browser speech recognition needs error handling and stop/cleanup on submit/unmount. These are targeted fixes to the existing design.

FR→AR switching preserved entered text and values in the browser check. The 360px layouts were generally usable; no blanket overflow or contrast failure is asserted. Keep the indigo styling, cards, fonts and `/claimant` routes.

### R12 — Notice templates can introduce unconfirmed facts · P1 before trusting outputs · later source-only review

[notice.ts:29](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/domain/notice.ts:29) uses case creation time as a claim date; template clauses reuse it as an incident or contractual due date. Other clauses assert prior unsuccessful démarches without a confirmed input. Requested remedy/narrative are missing from the notice facts contract. The 15-day deadline and legal basis are hardcoded, while the clause file describes itself as vetted without approval metadata.

**Fix:** separately confirm incident/due/prior-contact facts, omit unsupported assertions, incorporate the requested remedy, and store template/clause/deadline review status and version. Keep the existing prominent demo/unvalidated disclaimer. Research citations are useful but do not constitute legal approval; their legal correctness was not independently checked here.

### R13 — Setup and PDF recovery need a reproducible contract · P2 · source/setup

- `.env.example` is ignored and untracked, although README requires it. Add an explicit exception and commit only placeholders.
- The new locked Puppeteer 25.10.0 requires **Node ≥22.12.0**. Declare a supported runtime; the earlier Next-only minimum is insufficient. Preserve cross-platform scripts and the existing PATH.
- [render.ts:7](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/pdf/render.ts:7) retains a rejected launch promise or disconnected browser, preventing recovery without a server restart. Reset/relaunch with a bounded policy and close pages in `finally`.
- [fonts.ts:8](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/pdf/fonts.ts:8) swallows missing fonts and caches incomplete CSS. Missing required Arabic fonts must be an explicit document failure, and required assets must be packaged.
- `keccakOfString("0x1234")` was reproduced as hashing hex bytes rather than UTF-8 text, because [hash.ts:10](/Users/salehtouil/Desktop/Hack4Justice-IDEA3/src/lib/hash.ts:10) uses `toBytes`. Use explicit string encoding; restrict canonicalization to validated JSON.

## Verification performed and limits

All execution used isolated source/dependency copies and disposable SQLite databases. The original app on port 3000 was left running. Temporary review servers were stopped afterward.

| Check | Result |
|---|---|
| Default production build, intake snapshot | Passed with Next.js 16.3.5; includes claimant new/detail routes |
| Lint, intake snapshot | Passed with zero errors; unused `Locale` and `Priority` warnings |
| Fresh isolated database setup | First Prisma push returned an empty schema-engine error; initializing the empty SQLite file allowed push/seed to complete. Recheck clean setup on the declared runtime |
| Scoped claimant read | Another supplied user ID could not read the synthetic claimant case through the scoped service |
| Form creation and locale switch | New synthetic claim saved through browser; FR→AR preserved entered provider/category/text/amount/reference |
| Review gate | Both service and browser filed a claim with no evidence; confirms missing submission gate |
| Invalid category | Persisted through service; detail and claimant list failed with HTTP 500 |
| Stored-byte tampering | Modified disposable file; evidence remained `verified=true`, page still showed verified badge |
| Event digest | Filing event had a null payload digest |
| Demo/session behavior | Raw admin-ID cookie accepted; demo picker remained enabled with demo flag false |
| UTF-8 hashing | Ordinary text matched expected digest; `0x1234` did not |
| Notice/PDF update | Source review only; later dependency installation, build, PDF rendering and countdown timing not runtime-verified |
| Not exercised | Live Foundry calls, microphone permission/service, real delivery, on-chain transactions, payment, actual legal service, full accessibility/concurrency/load tests |

The repository changed during review. File/line references identify inspected code and can drift as Claude continues. The continuation prompt therefore starts by comparing current work against these findings and retaining fixes/features that already landed. It must not restart from the earlier scaffold or treat source-only findings as completed runtime tests.
