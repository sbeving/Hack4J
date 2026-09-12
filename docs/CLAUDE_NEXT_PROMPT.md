# Continue Sulha — implementation prompt, plan and todos

You are continuing the existing Sulha application in this repository. Your objective is to complete a defensible, working hackathon journey from a newly created claim through reviewed evidence, notice, provider response, escalation, institutional mediation and recorded settlement, with honest integrity and Agency Benefit displays.

**Execute the work in tested increments. This is not a request for another proposal or a rewrite.** Start by reconciling the current code with this handoff; you were actively coding during the review, so some findings may already be fixed. Read `AGENTS.md`, `CLAUDE.md`, `BUILD_PLAN.md`, `docs/IMPLEMENTATION_REVIEW.md`, and the relevant sections of `docs/TECHNICAL_PRD.md`. Consult `docs/CONTEXT.md` for product intent and source must-haves.

The review runtime-tested the intake snapshot at **2026-09-12 17:52:55 UTC** and source-reviewed notice/PDF additions at **18:08:18 UTC**, against committed baseline `c1911e5` plus uncommitted work. Do not assume that later changes passed the earlier build, and do not reintroduce issues already repaired. Preserve other contributors' work.

## 1. Keep the implementation direction

- Keep **Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Prisma 6 and SQLite**. Keep `/claimant`, `/provider`, `/institution` and `/admin`, the existing visual language, shared components and working bilingual shell.
- Keep AI behind `src/lib/ai/`, private local storage behind an adapter, PDF rendering behind `src/lib/pdf/`, and ledger behavior behind its own adapter. Check the current dependency manifest before adding anything. Puppeteer and Noto font packages were already added in the later reviewed snapshot.
- The longer PRD's FastAPI/PostgreSQL examples are design proposals, not a migration instruction. Implement their access, state, snapshot and retry guarantees in this monolith. Do not use `SELECT ... FOR UPDATE`/`SKIP LOCKED` as if SQLite supported the PostgreSQL design.
- Keep integer millimes, keccak256, human-reviewed facts, separate provider/resolver roles, immutable sent artifacts and explicit demo labels. Preserve Prisma major version 6.
- Do not modify PATH, replace `rg`, overwrite credential files, reset the shared database, or discard uncommitted work as a shortcut. Use an isolated disposable database for destructive test fixtures.
- Optimize for one **newly created, persisted case** across roles. A seeded walkthrough, a schema, a button, or a successful build alone does not establish feature completion.

## 2. Establish what is actually done

Inspect current status/diff and produce a compact working checklist. Existing code to keep and improve includes:

- `src/lib/session.ts`, `actions.ts`, `domain/constants.ts` and `prisma/schema.prisma`;
- claimant list/new/detail routes, `NewClaimForm`, `EvidenceUploadForm`, `SubmitButton`, `Tracker`;
- `domain/cases.ts`, `claim-actions.ts`, `events.ts`, `canonical.ts`, `storage.ts` and AI helpers;
- notice domain/actions/template, `NoticePanel`, `SlaCountdown`, the notice PDF route and PDF/font loaders, if still present in their current form.

Reproduce or clear the review's main failures before extending them: false verified badges after byte changes; invalid category/provider/amount inputs; filing without required review; non-atomic events; unapproved or stale notice sending; SLA resets; unsent-document access; count-based artifact collisions; inline unbounded AI; destructive ordinary seeding; and an ungated raw-ID session cookie.

Maintain one todo per concrete outcome, with `not started / in progress / verified / blocked`, owner, dependencies and evidence. Update `BUILD_PLAN.md` after a working checkpoint, using “implemented, acceptance fixes outstanding” where appropriate. Do not call a source-inspected component tested.

## 3. Architecture contract for the remaining work

Use this dependency direction:

```text
Role pages and client forms
        ↓
Server Actions / documented Route Handlers
        ↓
Validated domain commands and read policies
        ↓
Short Prisma transaction: state + version + records + audit + jobs
        ↓
Persisted worker jobs → AI / files / PDF / delivery / ledger adapters
```

**Identity/access:** derive the actor from the server session. Check role, case relationship and item-level sharing for every read/write/download. Provider membership alone must not reveal unsent notices or private claimant evidence. Administrative configuration access is not blanket case-content access. Deny unknown/invalid stored roles rather than trusting TypeScript casts.

**Concurrency:** commands accept an expected case version and a stable idempotency key. After current authorization, return an identical completed replay before rejecting its stale version. Within a short Prisma transaction, recheck state/version, perform a conditional update, allocate event sequence, write related records and enqueue effects. Treat a zero-row conditional update as a conflict. Use bounded retries for SQLite contention; never run model/PDF/file network work inside that transaction.

**Audit:** hash a versioned canonical envelope containing case ID, sequence, type, actor, time, visibility, payload and previous event digest. Every event, including `filed` with an empty payload, has a non-null digest. Metadata changes must change the digest. Filter private events in every participant view.

**Jobs:** use a minimal persisted Prisma job/outbox with unique logical effect keys, state, input revision, attempts, available time, lease/expiry and sanitized error. A single Node worker is enough initially. Candidate selection plus conditional claim/update must prevent duplicate execution when two workers contend. Recover expired leases after restart. Provide an actual cross-platform startup command and a supported standalone import/test setup for modules using `server-only`; do not remove server/client boundaries globally to make tests pass.

**Snapshots:** facts, evidence reviews, notices, dossiers and settlement terms have explicit immutable versions. A late worker result cannot replace newer human corrections. Resolve artifact keys inside the storage root and create immutable objects exclusively. Shared outputs bind their input revision, recipients and exact bytes.

Add only the schema needed for the next slice. Reuse current records, introducing minimal session, review/grant, idempotency/job, delivery and acknowledgement records as their behavior is implemented. One person owns shared schema/command contracts.

## 4. Ordered implementation waves

### Wave A — repair the foundation before growing the workflow

**A1 — reproducible and nondestructive setup**  
Own: `prisma/seed.ts`, package scripts, `.gitignore`, `.env.example`, README and runtime configuration.

- [ ] Make `db:seed` idempotent; preserve cases, events and unrelated fixtures. Keep deletion only in an explicit demo reset with a destination guard.
- [ ] Add second claimant/provider/institution fixtures for negative access tests.
- [ ] Track a placeholder-only `.env.example`; document the actual supported Node runtime. Puppeteer 25.10.0 requires at least Node 22.12.0; check the current lockfile and choose a supported release accordingly.
- [ ] Verify fresh setup in a new directory/database, including SQLite-file creation, dependencies, schema and seed. Keep commands usable on macOS and Windows.

**Gate:** normal seed run twice preserves a preexisting synthetic claim; no credentials are printed; a clean checkout can start using documented steps.

**A2 — demo identity and central access policies**  
Own: `session.ts`, authentication actions, Prisma session records and new domain policy helpers.

- [ ] Gate the picker/sign-in action by demo mode and an explicit fixture allowlist; turning demo mode off disables that entry point.
- [ ] Use opaque random session tokens with server-side expiry/revocation. Keep the convenient demo picker; do not bolt on an unnecessary full identity platform for the hackathon.
- [ ] Centralize claimant/provider/institution relationships and evidence/artifact grants. Correct the notice-download exception that gives admins blanket access or providers unsent PDFs.

**Gate:** forged raw user-ID cookies fail; expired/revoked sessions fail; another participant or an ungranted admin cannot fetch private artifacts; legitimate demo sessions work.

**A3 — strict inputs and editable confirmed facts**  
Own: `domain/schemas.ts`, money utilities, existing claim actions/services and draft forms.

- [ ] Validate category/remedy enums, provider kind, narrative bounds, references and amounts at the server boundary. Drafts may be incomplete; submissions may not bypass their declared completeness rules.
- [ ] Replace `parseFloat` input conversion with exact decimal-string parsing into integer millimes. Define accepted French/Arabic separators and digits; reject garbage suffixes, negative values, nonfinite values, extra decimals and values above the supported database range. Do not silently round user claims.
- [ ] Let claimants edit draft narrative, amount, provider/category/reference/remedy and correct AI suggestions. Record confirmed revisions separately from raw extraction.
- [ ] Make submission return missing fields/confirmations instead of changing state. Define category-specific evidence requirements explicitly; included evidence must be reviewed.

**Gate:** invalid category/provider/amount cannot create an unreadable case; `900`, `900.000` and supported equivalent localized forms map to 900000 millimes; corrections survive refresh; incomplete submission remains draft with useful errors.

**A4 — atomic commands and verifiable events**  
Own: case services/actions, event/canonical/hash helpers and focused schema constraints.

- [ ] Move state/record/event changes into one transaction and use expected versions. Apply this to create, evidence publication, confirmation, submission and every later command.
- [ ] Add idempotency for consequential or retryable commands; repeated confirmation must not emit duplicate effects.
- [ ] Replace interactive `count()+1` case numbering. Reserve document versions atomically and enforce unique case/document-version constraints.
- [ ] Correct UTF-8 hashing; constrain canonicalization to validated JSON; hash the full non-null event envelope.
- [ ] Repair lifecycle definitions for both-party term acknowledgement, decline/revision and conditional withdrawal. Keep the state table useful, but enforce ownership, data and deadline guards in the command service.

**Gate:** stale/concurrent commands produce one valid result or a conflict; a forced event failure leaves no partial business change; payloadless events retain the chain; changing event actor/type/time changes its digest.

### Wave B — finish the existing intake/evidence slice

**B1 — safe private storage and truthful verification**  
Own: `storage.ts`, evidence domain/actions, private download/verify routes and upload UI.

- [ ] Validate supported extensions, detected content and parser acceptance server-side; enforce 10 MiB/file, 10 files and 50 MiB/case unless the team explicitly changes and documents those proposed limits. Reject unreadable/encrypted PDF inputs clearly.
- [ ] Create a visible upload/evidence record before extraction. Use temporary objects and immutable finalized keys, with cleanup for abandoned files.
- [ ] Add authorized original preview/download and actual byte verification. Distinguish hash recorded, matched, mismatch, unavailable, extraction review and ledger status.
- [ ] Add item-level sharing; new private uploads do not become provider/institution visible merely because their case is shared.

**Gate:** wrong type/oversize input is rejected, another claimant cannot read an object, altered bytes fail verification, missing bytes are unavailable, and retries do not create conflicting originals.

**B2 — bounded asynchronous AI with source-linked review**  
Own: AI adapters, extraction/review schema, worker and evidence review UI.

- [ ] Persist draft/evidence and job state first; move classification/extraction out of the interactive save request.
- [ ] Use an explicit per-call timeout and total job deadline, one bounded retry policy, transient-error classification and cancellation. Do not retry authorization errors as malformed JSON.
- [ ] Return discriminated `complete / unreadable / failed / manual / recorded` results with source metadata; an empty object is not successful extraction.
- [ ] Separate invoice total from disputed amount; preserve evidence/page/quote references and uncertainty. A model suggestion never silently becomes confirmed data.
- [ ] Implement real labelled synthetic replay fixtures or accurately label the current heuristic/manual fallback. `AI_ENABLED=false` must make no external model request.
- [ ] Protect human corrections from late results and retain input/model/prompt/schema/review versions.
- [ ] Keep browser speech optional; stop recognition on submit/unmount, handle denied/failed service and retain typed text. Do not promise tested Derja accuracy without a relevant fixture run.

**Gate:** extraction → source preview → correction → confirmation works; timeouts remain recoverable; input is preserved; fallback provenance is visible; a stale job cannot overwrite a correction.

### Wave C — harden the notice work already in progress

**C1 — controlled facts and recoverable bilingual PDFs**  
Own: notice domain/template, legal clause metadata, PDF/font modules and `NoticePanel`.

- [ ] Use confirmed incident/due/prior-contact facts; never substitute case creation time for an event date. Include the requested remedy and relevant narrative. Omit assertions the user never supplied.
- [ ] Mark unreviewed legal material `unreviewed_demo`; retain references and the existing prominent disclaimer. Use versioned template/clauses/deadline policy with explicit review metadata. Do not call research alone lawyer approval.
- [ ] Produce Arabic/French sections from the same frozen facts. Ensure amounts, parties and dates agree.
- [ ] Reserve immutable notice versions/keys; reject conflicting bytes. Reset a rejected/disconnected Puppeteer instance, close pages reliably, and fail clearly when required fonts are missing. Disable unnecessary scripting/network access in the static renderer where compatible.

**Gate:** Arabic text shapes correctly, text remains readable/copyable, both languages use identical confirmed values, a renderer restart recovers, and regenerating cannot overwrite a prior version.

**C2 — exact approval, single delivery effect and authoritative deadlines**  
Own: notice actions/service, case/event/jobs/grants, `SlaCountdown`, tracking and notifications.

- [ ] Record final confirmation against the exact artifact digest, facts revision, recipient and evidence-sharing set. A separate screen is optional; an explicit recorded confirmation is mandatory.
- [ ] Enforce allowed lifecycle/current version before sending. Freeze approved material while a send is pending or outcome unknown; changes require a new reviewed version afterward.
- [ ] For the demo portal adapter, atomically record accepted simulated delivery, grants, one SLA instance/policy snapshot, event and notification records. Retries return/repair the same operation; another generated notice cannot restart the original deadline.
- [ ] Keep operational SLA separate from legal response deadlines. The short demonstration timer is labelled and restricted to demo cases. Legal service is not inferred from a portal receipt.
- [ ] Use stable server/client time baselines in the countdown; calculate eligibility server-side. Record one overdue event, including when a closing command wins the race before the scheduler.
- [ ] Add persisted notifications and visible activity refresh/polling. Show next responsible party and action; generation alone does not mean sent.

**Gate:** preview starts no SLA; accepted delivery starts one; retries and alternate notice versions cannot reset it; unsent PDFs remain private; countdown progresses; late closure preserves the breach.

### Wave D — complete provider resolution

Own: provider queue/detail/action UI, shared case policies/commands, provider response records and claimant decision UI.

- [ ] Show real provider-scoped claims, meaningful filters, deadlines, shared evidence, notice and attributed summaries.
- [ ] Implement acknowledge, structured information request/response, contest and proposed remedy with clear reason fields.
- [ ] Keep a proposed refund/correction/restoration open until the claimant accepts the exact proposal; record agreement without implying payment or account changes were executed.
- [ ] Preserve original claimant facts and private notes. Requests and proposals do not silently pause/reset the SLA.
- [ ] Expose server-derived allowed actions and escalation reasons to the UI.

**Gate:** provider A cannot access provider B's case; claimant sees actual responses; accepted remedy resolves the case; contest, declined remedy or overdue status makes escalation available under the declared rules.

### Wave E — standardized dossier and neutral institutional module

**E1 — consented escalation and immutable dossier**  
Own: escalation command/jobs, dossier renderer/JSON schema/receipt, claimant preview and institutional queue.

- [ ] Check eligibility on the server, show the neutral recipient and exact sharing set, then record claimant consent.
- [ ] Freeze one snapshot; generate fixed-order PDF and structured JSON with identical snapshot/version/event cutoff.
- [ ] Include parties/facts, timeline, exhibits, integrity manifest, exact notice/delivery receipt, shared responses and an attributed neutral summary. Exclude private notes and unselected uploads.
- [ ] Store final PDF/JSON digests and the dossier's own anchor receipt outside the files being hashed; avoid circular self-hashes.
- [ ] Grant institution access only after successful filing. Failure remains visible/retryable without duplicate escalations or premature access.

**Gate:** both exports agree, every included input is accounted for, pending anchors are labelled honestly, failed generation grants no institution access, and retry produces one filed dossier.

**E2 — mediation, exact terms and institution APIs**  
Own: institutional queue/detail, appointments, settlement commands/docs and Next Route Handlers.

- [ ] Let an authorized officer atomically accept/self-assign an unassigned dossier; reject competing acceptance.
- [ ] Schedule/reschedule with `Africa/Tunis` display and UTC persistence; show preparation and notify participants.
- [ ] Publish immutable settlement terms. Claimant and provider have their own acknowledgement UI, bound to the exact version/digest. Decline/revise returns to mediation and invalidates the applicability of old acknowledgements.
- [ ] Generate and record the PV only after both parties acknowledge current terms and the final artifact is ready. Label unvalidated records as demo drafts. A handoff package does not mean a court filing.
- [ ] Implement at least `GET /api/institutional/claims` and `GET /api/institutional/claims/[id]`, or one consistently documented versioned prefix, with institution-bound bearer scopes, pagination and shared domain authorization. Artifact downloads require their own scope/grant. Document examples and errors.

**Gate:** one institution sees only its cases; another party cannot acknowledge on someone else's behalf; revised terms require new acknowledgements; the final PV references the exact agreed terms; both documented read APIs work and deny unauthorized access.

### Wave F — honest ledger, analytics and institutional value

**F1 — ledger adapter**

- [ ] Implement the declared simulated adapter with explicit persistence/restart behavior; never invent a chain ID/transaction or label its result on-chain.
- [ ] Anchor commitments to evidence, documents and full audit-event digests, with random IDs/salts and a documented unambiguous encoding. Keep personal data, document text and user wallets out of ledger payloads.
- [ ] Add real Anvil integration if supported by the build target. Only actual chain receipts satisfy an on-chain demonstration. If using simulation, mark F9 as simulated/partial and disclose the remaining gap.
- [ ] Show pending/confirmed/failed/unavailable distinctly and preserve business progress during node failures. Record occurrence time separately from inclusion time.

**Gate:** authorized verification matches the subject bytes/commitment; retries do not create conflicts; altered content is detected; a node outage does not block claim handling; demo and chain evidence are unmistakable.

**F2 — analytics and Agency Benefit**

- [ ] Derive authorized queue/volume, resolution duration, pre-escalation resolution and SLA metrics from actual records/events; publish periods, counts and denominators.
- [ ] Separate live, seeded and estimated values. Do not count an open case as zero-time resolved, or a later settlement as erasing a provider SLA breach.
- [ ] Show editable savings assumptions. Example: `(80 − 10) × 100 / 60 = 116.7` estimated hours and `1.5 × 100 = 150` estimated folders. Do not double-count one case across provider and institution totals.
- [ ] Add a small authorized operations view for failed/old jobs and permitted retries, without confidential payloads or blanket administrative content access.

**Gate:** counts reconcile to fixtures, empty denominators are handled, assumptions are visible and changing them changes the estimate correctly.

### Wave G — integration, UX and rehearsal

- [ ] Replace static role shells with the implemented data flows; every visible action works or explains its unavailable state.
- [ ] Fix the tracker to distinguish draft/filed and resolved/settled/unsettled/withdrawn paths; derive current actor and actions from the server, including both parties during settlement.
- [ ] Complete FR/AR errors, notices and disclosures. Preserve form input on validation failures and locale changes; keep actor/organization visible on mobile.
- [ ] Associate narrative/upload labels, show field/action errors, manage dialog focus and announce meaningful outcomes. Isolate mixed-direction references and hashes. Verify 360px and desktop layouts without assuming source CSS proves accessibility.
- [ ] Run the complete fresh-case journey, negative authorization checks, retry/failure cases and PDF review. Rehearse the three-minute pitch separately; disclose any switch to a seeded later-stage case.
- [ ] Update README/BUILD_PLAN with actual commands, completed checks, fallback modes and remaining limitations. Remove stale claims that a component is complete merely because its schema or shell exists.

## 5. Parallel ownership and sequencing

Use parallel work only across genuinely independent responsibilities. You are not alone in this repository: preserve others' edits, coordinate shared files and adapt to changes rather than reverting them.

| Owner | Responsibility | Dependencies and boundaries |
|---|---|---|
| Lead/backend | Schema, access/session policy, commands, versions, events, jobs, delivery and integration APIs | Sole owner of shared transaction/schema contracts; publishes typed inputs/results |
| Frontend/coworker | Existing role pages, forms, review/preview interactions, tracker, notifications, accessibility and translations | Uses published action results; does not invent parallel lifecycle/auth rules |
| AI/documents, if capacity exists | Extraction/review formats, bounded model adapter, templates, fonts, PDF/dossier rendering | Receives immutable snapshots; cannot silently mutate confirmed facts or legal policy |
| Ledger/analytics, if capacity exists | Adapter/proofs and scoped metrics/benefit | Depends on stable event and artifact contracts; no changes to core state semantics |

With two people, the lead handles backend plus AI/documents; the coworker handles role UI and analytics against agreed contracts. Complete Wave A first, while small independent UI fixes can proceed. Then finish B/C, followed by D/E. F can proceed alongside D/E once its contracts are stable. G validates the integrated outcome. Keep each change narrowly reviewable and the app runnable after each checkpoint.

Do not spend the remaining build window recreating the shell, switching frameworks, adding native mobile, introducing microservices/Redis, or developing production KYC/payments/video/signatures. If time is short, simplify cosmetic polish and optional automation first. Preserve the required evidence, notice, dossier, institutional module and Agency Benefit outputs. Report an incomplete integration honestly instead of marking a fallback as the real service.

## 6. Required regression checklist

Add an actual runnable test setup if one is still absent. Use focused domain/DB tests plus a browser smoke journey. Test public command behavior and invariants, not copies of implementation formulas. Keep live AI/chain services out of the default suite.

- [ ] T01: ordinary seed preserves an existing case and is repeatable.
- [ ] T02: forged/expired/revoked sessions and disabled demo login are rejected.
- [ ] T03: second claimant/provider/institution and ungranted admin cannot read, mutate or download another party's material.
- [ ] T04: invalid enums/provider kinds/amount syntax/ranges are rejected before persistence.
- [ ] T05: draft correction survives reload; filing requires the declared confirmed facts/evidence.
- [ ] T06: double submit, stale version and concurrent commands yield one effect or a conflict; event failure rolls back business mutation.
- [ ] T07: event digests cover actor/type/time/sequence/previous link, including empty-payload events; UTF-8 and raw-byte vectors remain distinct.
- [ ] T08: invalid upload content/size/count fails clearly; original preview is authorized; altered/missing stored bytes produce mismatch/unavailable.
- [ ] T09: AI disabled makes no request; timeout/manual/recorded states are explicit; late results cannot replace a correction.
- [ ] T10: preview/generation does not start an SLA; confirmed simulated delivery starts it once; retries/new notice versions cannot reset it.
- [ ] T11: unsent PDF access is denied to provider/ungranted admin; simultaneous generation cannot overwrite a published artifact.
- [ ] T12: a stable countdown advances; authoritative overdue logic and late closure record one breach.
- [ ] T13: proposed remedy stays open until claimant acceptance; no action implies executed money movement.
- [ ] T14: failed escalation build grants no institution access; PDF/JSON share a snapshot; retry files once.
- [ ] T15: both parties acknowledge the exact current terms; revision invalidates old applicability; an officer cannot impersonate party consent.
- [ ] T16: institution APIs and artifact scopes enforce case/item boundaries.
- [ ] T17: renderer crash recovers, required fonts are present, and bilingual PDFs carry matching confirmed values.
- [ ] T18: simulated versus real ledger results are distinct; retries and dependency failures preserve truthful state.
- [ ] T19: analytics denominators and estimated savings reconcile; demo/live/estimated data remain labelled.
- [ ] T20: FR/AR, keyboard operation, field errors, preserved input, mobile actor identity and branch-aware status labels work in the actual flow.

Existing baseline commands include `npm run lint` and `npm run build`. Add and document the real commands for tests, worker and cross-role smoke verification; do not list nonexistent scripts as executed. Re-run affected checks after changes, then perform one clean integrated validation. Do not run a destructive seed/reset against a teammate's working database.

## 7. Completion and reporting contract

A successful delivery demonstrates one newly created claim through:

`draft → reviewed evidence/facts → filed → approved notice → accepted simulated delivery → provider handling → eligible claimant-confirmed escalation → immutable dossier → assigned neutral mediation → exact terms acknowledged by both parties → recorded PV`.

Also demonstrate the direct provider-remedy branch, an altered-file mismatch, a rejected cross-party read, one recoverable background failure, a persistent notification and the transparent Agency Benefit calculation. The institution API must be callable, not just documented. State clearly whether ledger anchoring is simulated or actually included on Anvil.

At each meaningful checkpoint, report what now works, what was tested and the next dependency. At completion provide:

1. Working routes/capabilities and the completed checklist items.
2. Exact validation commands/results and meaningful manual/browser checks.
3. Remaining known limitations, especially legal review, delivery, signatures, live AI and ledger mode.
4. Startup/demo instructions for macOS and Windows, with credentials omitted.

Begin by reviewing the current diff and fixing the still-present Wave A failures. Then continue through the dependent waves without stopping at another plan or a cosmetic screen demonstration.
