# Sulha — Product Requirements Document (PRD)
### MSME Claims & Dispute-Management Platform for Service-Provider Disputes (incl. State-Owned Enterprises)

**Event:** Hack4Justice 2026 (HiiL Tunisia) — Challenge B
**Build window:** 24-hour hackathon MVP
**Team profile:** 3–5 people, strong in AI/ML, full-stack/backend, frontend/UX
**Document status:** Build-ready v1 (Idea B)
**Legend:** `[MUST]` = graded must-have from the Developer Brief · `[CORE]` = needed for a credible MVP · `[STRETCH]` = post-MVP

---

## 0. Framing decisions (read first)

This PRD builds **Idea B** — a claims/complaints platform where MSMEs raise issues against **service providers**, many of which are **state-owned monopolies** (STEG, SONEDE, La Poste, SNCFT, telecoms, delivery/logistics). Three deliberate choices keep it fundable *and* inside the graded brief:

1. **A "claim" is a commercial service dispute, not an administrative grievance.** In-scope: billing errors, overcharging, service interruption/damage, deposit/refund disputes, delivery/service failures. Out-of-scope (drifts to admin law / Challenge 1): permits, grants (APII/APIA), registration acts (RNE), tax assessments. *The test: is the entity acting as a **commercial counterparty** (in) or a **public authority** (out)?*
2. **Two institutional roles, not one.** The **provider claims desk** handles first-line resolution (the white-label target and the "government enterprise" the PM wants integrated); a **neutral resolver** (mediation / consumer-protection body / RNE Dispute Officer) handles escalation — this is the brief's *mandatory institutional module*. Keeping the binding resolver neutral is both brief-faithful and the platform's defensibility (a provider can't credibly judge a dispute against itself).
3. **The brief's mandatory outputs are retained** (Mise en demeure, verified evidence, standardized claim dossier, institutional module, Agency Benefit) — engineered as features inside the claims flow so the platform clears the graded gate.

> All legal references and the exact Tunisian ADR/consumer-protection institution must be validated with a legal mentor on Day 1.

---

## 1. Overview

### 1.1 Problem
Tunisian MSMEs depend on a handful of monopoly service providers — electricity/gas (STEG), water (SONEDE), post/logistics (La Poste, delivery firms), telecom, rail (SNCFT). When one of them overbills, cuts a service, or fails a delivery, the MSME has **no alternative provider** and a huge power asymmetry. The provider's complaint process is opaque, paper-based, and slow; formal legal action costs more than the disputed amount. So the MSME absorbs the loss. On the other side, provider desks and mediation/consumer bodies drown in unorganized paper claims, missing evidence, and manual backlogs.

### 1.2 Product
**Sulha** (صلح — "amicable settlement") is a bilingual (Tunisian Derja + Arabic RTL + French) web + mobile **claims and dispute-management network**. An MSME files a claim against a provider in minutes; AI classifies and routes it, verifies the evidence, and generates a legally sound formal notice; the MSME tracks it **like a delivery app**; the provider desk resolves it within an SLA; and if unresolved, Sulha bundles a **standardized dossier** and escalates to a **neutral resolver** for digital mediation — settling out of court, on the record.

### 1.3 Lifecycle
`FILE CLAIM → CLASSIFY & ROUTE → VERIFY EVIDENCE → NOTICE (Mise en demeure) → PROVIDER RESOLUTION (SLA) → [if unresolved] DOSSIER → NEUTRAL RESOLVER → DIGITAL MEDIATION → PV de Conciliation` (or hand-off to Injonction de payer).

---

## 2. Goals & success metrics

**Product goals:** cut the cost/time for an MSME to contest a monopoly provider to near-zero; give provider desks and resolvers a paperless, evidence-complete queue; make provider responsiveness measurable and accountable.

**Hackathon success = on Demo Day:** a live end-to-end run (file → classify → notice → track → escalate → mediate → settle) on real code; all brief must-haves working; a defensible Agency Benefit number; on-chain SLA/audit timeline visible.

---

## 3. Grading alignment

| Requirement / axis | Where it lives | Status |
|---|---|---|
| Upload supporting proof | F2 Evidence upload | `[MUST]` |
| Auto-generate Mise en demeure | F4 Notice | `[MUST]` |
| Standardized digital claim dossier | F7 Dossier | `[MUST]` |
| Institutional module (Clerk/Mediator/Arbitrator/RNE) — paperless | F8 Neutral resolver console | `[MUST]` |
| "The Agency Benefit" quantification | §15 + demo | `[MUST]` |
| Governmental integration (graded) | Provider desk (state enterprises) + neutral resolver + Public API Hook | `[CORE]` |
| Monetization (graded) | §14 white-label + freemium network | `[CORE]` |
| Customer experience (graded) | F5 delivery-app tracking | `[CORE]` |
| Business plan (graded) | §14 network moat + expansion | `[CORE]` |

---

## 4. Users & personas

- **P1 — Amira, MSME owner (claimant):** overbilled by STEG; non-technical; works in Derja/French. Needs to contest without a lawyer and *see progress*.
- **P2 — Sami, Provider Claims Desk agent (state enterprise, e.g., STEG):** buried in paper claims. Needs structured, verified claims and a workflow. *White-label target + governmental integration.*
- **P3 — Karim, Neutral Resolver (mediator / consumer-protection officer / RNE Dispute Officer):** handles escalations paperlessly. *Mandatory institutional module.*
- **P4 — Platform Admin (network operator):** manages tenants, SLAs, analytics.

---

## 5. Scope

**In (MVP):** commercial service disputes with providers — **primary: STEG/SONEDE billing & service disputes**; secondary: delivery/logistics failure and telecom billing. **Stretch:** AI smart legal contract at deal time; multi-provider bulk claims; ANCE e-signature.
**Out:** administrative acts (permits/grants/registration/tax); real money movement; binding enforcement; KYC; non-commercial complaints.

---

## 6. End-to-end flow

1. **File claim** — MSME picks provider + dispute type; describes via Derja voice/text; enters amount (TND) & reference (e.g., STEG contract no.).
2. **AI classify & route** — model tags claim type, urgency, responsible provider + desk/department; flags duplicates.
3. **Evidence upload & verify** `[MUST]` — bills, contracts, delivery receipts, photos, emails, chat screenshots; AI extracts + builds timeline; each file hashed.
4. **Formal notice** `[MUST]` — auto-generate **Mise en demeure** / billing-dispute demand; bilingual PDF; SLA clock starts.
5. **Delivery-app tracking** `[CORE]` — MSME dashboard shows live stages + SLA countdown + notifications.
6. **Provider resolution** — provider desk receives the structured claim, responds/resolves within SLA (adjust bill, refund, restore service) or contests.
7. **Escalation → dossier** `[MUST]` — on SLA breach / rejection, one-click **standardized dossier** (evidence + integrity manifest + notice + neutral AI summary; PDF+JSON).
8. **Neutral resolver & mediation** `[MUST]` — dossier routes to the neutral institutional module; officer reviews verified evidence, schedules digital mediation, records **PV de Conciliation**, or hands off to Injonction de payer.
9. **On-chain SLA/audit** — every state change and evidence hash logged immutably for accountability + the Agency Benefit.

---

## 7. Feature specifications

### F1 — Claim intake & classification `[CORE]`
**Story:** As Amira, I file a claim against a provider in my own words.
**Details:** Provider picker + dispute-type; Derja voice (speech-to-text) or text; captures amount (TND), reference, counterparty; AI pre-classifies type + urgency.
**Acceptance:** Case created with `caseId`, provider, type, status `Filed`; voice transcribes to editable text; classification shown and user-correctable.

### F2 — Multi-modal evidence upload & verification `[MUST]`
**Story:** As Amira, I upload my bills, photos, emails, and chats and the system reads them.
**Details:** Accept `.txt/.md/.pdf/.png/.jpg`; vision-LLM transcribes mixed Arabic/French/Derja (Tesseract `ara+fra+eng` fallback); multiple files; each hashed (keccak256); AI extracts structured records + timeline; flags gaps/conflicts for confirmation (never fabricates).
**Acceptance:** All types accepted/previewable; a chat/bill screenshot transcribed usefully in demo; every file shows a "verified" hash; fields editable.

### F3 — AI classification & routing `[CORE]`
**Story:** As the platform, I send each claim to the right provider desk/department.
**Details:** Classify claim type + priority; map to provider + desk/queue; detect duplicates/patterns; draft an internal routing summary.
**Acceptance:** ≥ 3 claim types classified correctly in demo; each routes to the correct provider queue; priority visible.

### F4 — Formal notice (Mise en demeure) generation `[MUST]`
**Story:** As Amira, I get a proper formal notice with a legal deadline, no lawyer.
**Details:** RAG over a Tunisian legal corpus (Code des Obligations et des Contrats + a vetted notice/utility-dispute clause library); constrained slot-filling into a lawyer-reviewed template; strict deadline; bilingual (Arabic RTL + French) PDF; plain-language section explanations.
**Acceptance:** Notice contains parties, amount (TND), legal basis, deadline, consequences; downloadable bilingual PDF; template file present in repo (mentor-reviewable); no free-written legal claims.

### F5 — Delivery-app status tracking `[CORE]`
**Story:** As Amira, I watch my claim move like a package.
**Details:** Stage tracker (Filed → Notice sent → Provider reviewing → Resolved / Escalated → In mediation → Settled); SLA countdown; push/email/SMS notifications on each change.
**Acceptance:** Status updates in real time on state change; SLA timer visible; ≥ 1 notification fires in demo.

### F6 — Provider claims desk (white-label) `[CORE]`
**Story:** As Sami (provider agent), I resolve structured claims without paper.
**Details:** Provider inbox with SLA timers; case detail (verified evidence + AI summary + suggested resolution); actions: acknowledge, request info, resolve (adjust bill / refund / restore), contest. White-label branding per provider.
**Acceptance:** Agent opens a claim, sees verified evidence + tamper-check, and changes state; resolution closes the case and notifies the MSME.

### F7 — Escalation & standardized claim dossier `[MUST]`
**Story:** As Amira, if the provider ignores me, I escalate with one click.
**Details:** On SLA breach/rejection, auto-compile a **standardized** dossier: cover sheet (parties, amount, legal basis), timeline, verified evidence + **integrity manifest** (file→hash→on-chain ref), the notice + proof of sending, and an AI neutral case summary. Export PDF (human) + JSON (machine).
**Acceptance:** One action → PDF+JSON; fixed section order every time; manifest lists every hash + on-chain reference.

### F8 — Neutral institutional resolver module (mandatory) `[MUST]`
**Story:** As Karim (mediator / consumer-protection / RNE officer), I receive structured claims and run mediation paperless.
**Details:** (a) **Admin Dashboard** — queue of escalated claims + SLA timers; case detail with verified evidence + tamper-check + AI summary; actions: accept, request info, schedule digital mediation, approve, record settlement. (b) **Public API Hook** — documented REST so an institution's own system can integrate. Role-based access.
**Acceptance:** Officer opens a dossier with a pass/fail integrity check; schedules mediation + changes state; settlement produces a **PV de Conciliation**; ≥ 2 API endpoints live + documented.

### F9 — SLA + evidence-integrity ledger (on-chain) `[CORE]`
**Story:** As all parties, I trust that timestamps and evidence weren't altered.
**Details:** Hash-anchor evidence, notice, dossier; emit lifecycle + SLA events (filed → acknowledged → resolved/breached) to an append-only ledger; **hashes/events only, never PII/text**; invisible wallets (custodial + gasless meta-tx; phone-OTP "sign"). Powers accountability + Agency Benefit.
**Acceptance:** Hashes written + re-verifiable in UI; audit timeline renders on-chain events; no personal data on-chain.

### F10 — Analytics & Agency Benefit dashboard `[CORE]`
**Story:** As a provider/resolver/admin, I see caseload, resolution time, and hours/paper saved.
**Details:** Volume by type/provider, avg resolution time, % resolved pre-escalation, SLA compliance, paper folders & clerk-hours saved.
**Acceptance:** Dashboard renders seeded metrics feeding §15 numbers.

### F11 — AI smart legal contract at deal time `[STRETCH]`
Generate an e-signable, pre-hashed agreement upstream so future disputes start with bulletproof primary evidence. Build only after F1–F10.

---

## 8. AI touchpoints (state explicitly — judges will probe)
1. Multi-modal evidence intake in Derja/Arabic/French (speech-to-text + vision OCR + extraction).
2. Claim classification, priority triage, routing, duplicate detection.
3. Evidence structuring + timeline + gap/conflict detection.
4. Grounded Mise en demeure generation (RAG + constrained templates).
5. Dossier assembly + neutral case summarization + suggested resolutions for desks/mediators.
**Framing:** AI does language-heavy, judgment-*support* work; legal outputs use vetted templates + human-in-the-loop; the neutral resolver decides.

---

## 9. Data model (core)

```
User        { id, role[msme|provider_agent|resolver|admin], name, phone, lang, providerId?, walletId }
Provider    { id, name, type[utility|logistics|telecom|other], stateOwned:bool, slaHours, branding }
Case        { id, claimType, claimantId, providerId, amountTND, reference, status, priority,
              narrative, createdAt, slaDueAt }
Evidence    { id, caseId, kind[bill|contract|receipt|photo|email|chat|other], fileUrl,
              extracted{party,amount,dates,refs}, contentHash, onchainTx, verified }
Notice      { id, caseId, type[mise_en_demeure], deadlineDays, pdfUrl, contentHash, sentAt, onchainTx }
Dossier     { id, caseId, pdfUrl, jsonUrl, summary, integrityManifest[], contentHash, onchainTx, filedAt }
Mediation   { id, caseId, resolverId, scheduledAt, status, settlementOptions[], outcome }
Settlement  { id, caseId, type[pv_conciliation], termsHash, signedAt, onchainTx }
SLAEvent    { id, caseId, type[filed|acknowledged|resolved|breached|escalated], hash, actor, ts }
```
Case states: `Filed → Classified → NoticeSent → ProviderReview → (Resolved | Escalated) → DossierFiled → InMediation → (Settled | HandedToCourt | Withdrawn)`

---

## 10. API endpoints (FastAPI)

**MSME**
```
POST /cases                        file claim (intake + classify)
POST /cases/{id}/evidence          upload → extract + hash + anchor
GET  /cases/{id}/timeline          structured timeline
POST /cases/{id}/notice            generate Mise en demeure
GET  /cases/{id}/status            delivery-app status + SLA
POST /cases/{id}/escalate          build dossier + route to resolver
```
**Provider desk (white-label)**
```
GET  /provider/claims                       queue + SLA timers
GET  /provider/claims/{id}                  detail + verified evidence
POST /provider/claims/{id}/action           acknowledge | resolve | request_info | contest
```
**Institutional (Public API Hook — mandatory module)**
```
GET  /institutional/claims                  escalated structured claims
GET  /institutional/claims/{id}             dossier + evidence + integrity check
POST /institutional/claims/{id}/mediation   schedule digital mediation
POST /institutional/claims/{id}/settlement  record PV de Conciliation
```
**Integrity**
```
GET  /verify/{hash}                re-verify a hash against chain
GET  /cases/{id}/audit             on-chain SLA/event timeline
```

---

## 11. Solidity contract interface (SLA + integrity ledger)

Purpose: tamper-evident **SLA accountability + evidence integrity**. Hashes/events only.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SulhaLedger is AccessControl {
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    enum State { Filed, NoticeSent, ProviderReview, Resolved, Escalated, DossierFiled, InMediation, Settled, HandedToCourt, Withdrawn }

    struct Case { address claimant; State state; uint256 filedAt; uint256 slaDueAt; }
    mapping(bytes32 => Case) public cases;               // caseId => Case
    mapping(bytes32 => bytes32[]) public evidenceHashes; // caseId => hashes

    event CaseFiled(bytes32 indexed caseId, address indexed claimant, uint256 slaDueAt, uint256 ts);
    event EvidenceAnchored(bytes32 indexed caseId, bytes32 hash, uint256 ts);
    event NoticeSent(bytes32 indexed caseId, bytes32 hash, uint256 ts);
    event ProviderAck(bytes32 indexed caseId, uint256 ts);
    event Resolved(bytes32 indexed caseId, uint256 ts);
    event SLABreached(bytes32 indexed caseId, uint256 ts);
    event Escalated(bytes32 indexed caseId, uint256 ts);
    event DossierFiled(bytes32 indexed caseId, bytes32 hash, uint256 ts);
    event MediationScheduled(bytes32 indexed caseId, uint256 when, uint256 ts);
    event SettlementRecorded(bytes32 indexed caseId, bytes32 termsHash, uint256 ts);

    function fileCase(bytes32 caseId, uint256 slaDueAt) external;
    function anchorEvidence(bytes32 caseId, bytes32 hash) external;
    function sendNotice(bytes32 caseId, bytes32 hash) external;
    function providerAck(bytes32 caseId) external onlyRole(PROVIDER_ROLE);
    function resolve(bytes32 caseId) external onlyRole(PROVIDER_ROLE);
    function escalate(bytes32 caseId) external;                 // auto on SLA breach
    function fileDossier(bytes32 caseId, bytes32 hash) external;
    function scheduleMediation(bytes32 caseId, uint256 when) external onlyRole(RESOLVER_ROLE);
    function recordSettlement(bytes32 caseId, bytes32 termsHash) external onlyRole(RESOLVER_ROLE);
    function verifyEvidence(bytes32 caseId, bytes32 hash) external view returns (bool);
}
```
**Infra:** invisible wallets (custodial + EIP-2771 gasless meta-tx / paymaster); **local Anvil node for the live demo** (+ optional Polygon Amoy); permissioned EVM (Hyperledger Besu/QBFT) as the gov production option; read audit timeline via event logs. Tooling: Foundry/Hardhat + viem/ethers.js + OpenZeppelin; backend = relayer/oracle.

---

## 12. Screens
**MSME app:** claim intake (provider + Derja voice); evidence upload (multi-file + verify status); status tracker (stages + SLA + notifications); notice preview/send; dossier preview/export.
**Provider desk (white-label):** claims inbox (SLA timers); case detail (verified evidence + AI summary + suggested resolution); resolve/contest actions; analytics.
**Neutral resolver console:** escalated-claims queue; case detail + tamper-check + AI summary; mediation scheduler; PV de Conciliation generator; Agency Benefit analytics.

---

## 13. Tech stack
Frontend: React (consoles) + React Native/Flutter (MSME), bilingual + Arabic RTL. Backend: Python FastAPI. DB: PostgreSQL + pgvector. AI: LLM via API (swappable open-source Arabic-capable model for gov data-sovereignty), Whisper (Derja STT), vision LLM (evidence OCR; Tesseract fallback). Blockchain: Solidity + Foundry/Hardhat + viem/ethers.js + OpenZeppelin. Public API Hook = documented REST.

---

## 14. Business model, monetization & governmental integration

**The network (moat):** a **central, neutral MSME-facing claims network** — the single door across all providers — where providers/institutions connect. Do **not** ship isolated per-provider instances; that recreates silos any provider could build and destroys the moat. Answer to "why not build it themselves": no single provider can build a *neutral* cross-provider network, and a provider can't credibly adjudicate disputes against itself.

**Revenue:**
- **White-label consoles** for providers/institutions (SaaS per seat/tenant + branding) — the STEG/SONEDE/resolver desks.
- **Freemium for MSMEs:** free to file & track; premium = analytics, bulk/multi-provider claims, priority handling, API access, contract-generation (stretch).
- **Per-resolution / integration fees** for connected institutions.

**Governmental integration:** state-owned providers (STEG, SONEDE, La Poste, SNCFT) as counterparties *and* adopters of the white-label desk; neutral resolver = a public mediation/consumer-protection body or RNE Dispute Officer (the mandatory module); Public API Hook for their existing systems; data-sovereignty option (on-prem / open-source LLM / permissioned chain). Phase-2 network expansion to more agencies strengthens the TAM story without polluting the graded demo.

---

## 15. The Agency Benefit (mandatory pitch model)
*"If a provider/mediation center connects to Sulha, here's what each case saves."* Illustrative per-case model (replace with mentor-validated figures; transparent assumptions, not official stats):

| Step | Manual/paper baseline | With Sulha | Saving |
|---|---|---|---|
| Claim intake + completeness check | ~60–90 min | ~10 min (structured) | ~50–80 min |
| Physical file handling / copies | 1–2 paper folders | 0 | 1–2 folders |
| Missing-evidence back-and-forth | ~2 exchanges (days) | 0 (validated at intake) | queue delay cut |
| Evidence integrity verification | manual/uncertain | one-click tamper-check | time + risk |

**Headline:** ≈ **60–80 minutes** and **1–2 paper folders saved per case**, missing-evidence queue-delay largely removed; multiply by caseload on the analytics dashboard. Targets the **Institutional Adoption Prize**.

---

## 16. Data protection & "why blockchain"
**Data protection:** hash-anchor only; never write PII/contract text on-chain → compliant with Tunisia's INPDP / Law n°2004-63. **Why a ledger vs a DB log:** a DB audit log is controlled by whoever runs it; in a provider dispute, an independent, tamper-evident record of *when a claim was filed, acknowledged, breached, resolved* is the neutral accountability primitive neither party (nor the platform) can quietly edit. Honest caveat: for a single trusted operator a DB log suffices; the ledger earns its place across a multi-provider network.

---

## 17. Tunisian grounding & glossary
Currency **TND**; languages **Derja + Arabic (RTL) + French**; legal basis **Code des Obligations et des Contrats (COC)**; e-signature **Law n°2000-83 / ANCE** (production path). In-scope providers (commercial capacity): **STEG, SONEDE, La Poste, SNCFT, Transtu, ONAS, telecoms, delivery/logistics**. Out-of-scope (public authority): APII/APIA grants, RNE registration acts, permits, tax.
**Glossary (verbatim):** *Mise en demeure* (formal notice with strict deadline); *Injonction de payer* (fast-track order for undisputed debt); *Tribunal de Commerce* (B2B commercial court); *PV de Conciliation* (official amicable-settlement record via a recognized mediator); *RNE* (Registre National des Entreprises).

---

## 18. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Drift into administrative complaints (off-brief) | Hard scope rule: commercial service disputes only (role test) |
| Legal wording wrong | Vetted templates + Day-1 legal mentor; AI fills slots only |
| Provider won't be held to a public SLA clock | Frame SLA ledger as *their* proof of responsiveness (Agency Benefit), not a stick |
| Provider = judge of its own case | Binding resolution stays with a neutral resolver |
| OCR fails on messy Derja/French | Vision-LLM primary + Tesseract fallback + human confirm |
| Live chain flakiness | Local Anvil primary; testnet optional |
| White-label silos kill the moat | Central neutral network; white-label only the console layer |

## 19. Assumptions & out-of-scope
**Assumptions:** provider/resolver reachable; legal mentor available Day 1; demo data seeded; payments & registered-mail mocked. **Out-of-scope:** money movement; binding enforcement; KYC; administrative disputes; production ANCE.

---

## 20. 24-hour plan & demo script

**Role split.** *AI/ML:* Derja STT; vision OCR + extraction + timeline; classification/routing; RAG + Mise en demeure; dossier summary + suggested resolutions. *Backend:* FastAPI + schema + state machine; hashing + relayer; dossier (PDF+JSON+manifest); provider + institutional APIs + auth. *Smart-contract:* `SulhaLedger` on Foundry/Anvil (+optional Amoy); gasless relayer + custodial wallets; audit-timeline queries. *Frontend/UX:* MSME flow + delivery-app tracker (bilingual RTL); provider desk; resolver console; Agency Benefit analytics.

**Timeline:** 0–2 schema + contract skeleton + screen shells; 2–8 intake + evidence + classification; 8–13 notice + tracker + provider desk; 13–17 escalation + dossier + resolver console; 17–20 on-chain anchoring + audit timeline; 20–23 mediation + PV + Agency Benefit + polish; 23–24 seed data + rehearse + commits.

**Demo (3 min; 45s reserved for Agency Benefit):**
- 0:00–0:20 — Hook: "A Tunisian workshop is overbilled 900 TND by STEG. No other provider. No affordable recourse. Watch."
- 0:20–1:05 — File in Derja + upload the bill and a photo → AI classifies + routes → generates the **Mise en demeure** → MSME watches the **delivery-app tracker**.
- 1:05–1:40 — SLA lapses → one-click **standardized dossier** with on-chain **integrity manifest**.
- 1:40–2:15 — Flip to the **neutral resolver console**: tamper-check, AI summary, **schedule mediation**, record **PV de Conciliation**; on-chain SLA timeline shown.
- 2:15–3:00 — **"The Agency Benefit"** slide: ≈ 60–80 min + 1–2 folders saved per case × caseload; close on neutral, paperless, verifiable resolution against a monopoly.

---
*Prepared for Hack4Justice 2026 — Challenge B (Idea B). Validate all legal references with a mentor before the pitch.*
