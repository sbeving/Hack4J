# Moufehma — Build Plan & Status

Single source of truth for the 24h build. See `docs/CONTEXT.md` (product PRD) and
`docs/TECHNICAL_PRD.md` (technical spec). This plan is the **hackathon-scoped** slice:
one seeded golden-path case that lights up **every graded must-have**.

## Win condition
The §20 demo script runs live end-to-end without a crash; every graded box visibly
lights up; DEMO / simulated labels present; Agency Benefit number on screen.

## Stack (locked)
- **Next.js 16 + React 19 + TypeScript + Tailwind v4** — one monolith, all 4 role consoles + API.
- **Prisma 6 + SQLite** (`prisma/dev.db`). Amounts are integer **millimes** (`Int`).
- **Claude via Azure Foundry** (`AI_MODEL=claude-opus-4-8`) — vision OCR/extraction, classification, notice slot-fill, dossier summary.
- **Puppeteer** → bilingual AR-RTL / FR PDFs. **viem** keccak256 + optional Anvil.
- **Ledger adapter**: `memory` (default, never breaks on stage) | `anvil` (real, optional).

## Phases (checkpoint-driven — always runnable)

| # | Phase | Status | Delivers |
|---|-------|--------|----------|
| 0 | Scaffold + auth + shell | ✅ done | Repo, Prisma schema, seed, demo login (real role checks), bilingual RTL shell, 4 role dashboards |
| 1 | Intake + Evidence + Classify | ✅ done | Claim intake (Derja voice), evidence upload + keccak256 + Claude vision extraction, AI classify/route, claimant case list + detail + tracker |
| 2 | Notice + Tracker | ✅ done | Bilingual AR/FR Mise en demeure PDF (Puppeteer, COC-cited), send + simulated delivery, live SLA countdown, notifications, demo bill asset (vision-verified) |
| 3 | Provider desk | ✅ done | Branded inbox + SLA timers, AI neutral summary + suggested resolution, acknowledge/request-info/contest/propose-remedy, claimant accept/decline → resolved. Hardening: real keccak256 re-verification (genuine tamper-check), input validation, safe label lookups |
| 4 | Dossier + Resolver console | ✅ done | Escalation (eligibility + consent) → dossier PDF (fixed 8 sections) + JSON + integrity manifest + bundle hash; resolver console (branded, AI neutral summary, tamper-check) → accept → schedule mediation → publish terms → party acknowledge → record PV de Conciliation → settled; 2 bearer-auth institutional API endpoints (documented in docs/institutional-api.md) |
| 5 | Ledger | ✅ done | Salted keccak256 commitment anchoring (domain-separated) of evidence/notice/dossier/settlement + every lifecycle event; on-chain audit timeline UI with tx/block per event; memory adapter (default, labeled "simulation") + Anvil adapter ready (`LEDGER=anvil`) |
| 6 | Analytics + Agency Benefit | ✅ done | 15 seeded historical cases (extra MSMEs keep Amira's list clean), admin KPI dashboard (volume/type/provider/avg-resolution/SLA/pre-escalation), Agency Benefit panel (transparent model: hours + folders + exchanges saved) |
| 7 | Rehearse + polish | ✅ done | Notifications bell + page, DEMO_SCRIPT.md (3-min walkthrough), real Solidity ledger (`contracts/SulhaLedger.sol` + Foundry tests + deploy, ABI matches the adapter) for the optional Anvil path |

**Status: all phases complete.** Full golden path verified end-to-end (intake → classify → notice → SLA → provider → contest → escalate → dossier → resolver → mediation → PV → settled) plus institutional API, on-chain audit timeline, and Agency Benefit dashboard. Every graded must-have (F2/F4/F7/F8/Agency Benefit/F9) demonstrated live.

## Graded must-have coverage map
- **F2 Evidence + verify** → Phase 1 (upload + keccak256 + vision extraction; tamper demo)
- **F4 Mise en demeure** → Phase 2 (versioned template, slot-fill only, AR/FR PDF)
- **F7 Dossier** → Phase 4 (fixed-section PDF+JSON, integrity manifest)
- **F8 Resolver + Public API Hook** → Phase 4 (console + 2 bearer-auth `/institutional/*` endpoints)
- **Agency Benefit** → Phase 6
- **F9 on-chain** → Phase 5

## Suggested split (solo + 1 coworker on Windows)
- **Lead (Mac):** core golden path (intake → notice → dossier → resolver), AI adapter, ledger.
- **Coworker (Windows):** provider desk polish, analytics/Agency-Benefit dashboard, bilingual
  string sweep, legal template content, seed data. All cross-platform (npm scripts, SQLite, bundled Chromium).

## Fallback ladder (if behind)
Cut in this order: real Anvil → `memory`; provider white-label theming; Derja voice → textarea;
live AI → recorded fixtures (`AI_ENABLED=false`).

## Known demo limitations (accepted, from QA review 2026-09-12)
- Demo login stores the user id in an unsigned cookie (that's the demo-picker design). A production
  build must sign sessions and not expose `/auth/demo-session`.
- Claims can be submitted with zero evidence (UX choice; the demo always attaches evidence).
- Fresh clone: if `npm run db:push` errors on a missing SQLite file, run it once more (Prisma creates it).

## Environment
Copy `.env.example` → `.env`, fill `ANTHROPIC_FOUNDRY_API_KEY`. `LEDGER=memory` and
`DEMO_MODE=true` by default. Never commit `.env` (gitignored).
