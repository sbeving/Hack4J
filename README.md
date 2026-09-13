# Moufehma · مفاهمة

**Neutral claims & dispute-resolution network for Tunisian MSMEs** facing service providers
(STEG, SONEDE, La Poste, SNCFT…). File a commercial claim in minutes, verify evidence, generate a
formal *Mise en demeure*, track it like a delivery app, and escalate to a neutral mediator with a
standardized, tamper-evident dossier.

> Hack4Justice 2026 — Challenge B. 24-hour MVP. **Demo data only** — no real legal service.

## Quickstart (macOS & Windows)

```bash
# 1. install deps
npm install

# 2. configure env (then edit .env: set ANTHROPIC_FOUNDRY_API_KEY)
cp .env.example .env

# 3. create + seed the database
npm run db:push
npm run db:seed

# 4. run
npm run dev            # http://localhost:3000
```

Everything is cross-platform: npm scripts, SQLite (no DB server), and Puppeteer bundles its own
Chromium. The blockchain anchor defaults to `LEDGER=memory` (no chain needed); real Anvil is optional.

## Demo accounts
The landing page is a **role picker** (real server sessions + access checks):
Amira (MSME claimant) · Sami (STEG provider desk) · Karim (neutral mediator) · Admin.

## Scripts
| Script | What |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run db:push` | Sync Prisma schema → SQLite |
| `npm run db:seed` | Seed orgs + demo users |
| `npm run db:reset` | Wipe + re-push + re-seed |
| `npm run db:studio` | Prisma Studio |
| `npm run build` / `start` | Production build / serve |

## Architecture
- **Next.js 16 monolith** — 4 role consoles (`/claimant`, `/provider`, `/institution`, `/admin`) + API routes.
- **Prisma 6 + SQLite**. Amounts stored as integer **millimes** (1 TND = 1000).
- **AI**: Claude via Azure Foundry (`src/lib/ai/`) — OCR/extraction, classification, notice, summary.
- **Ledger**: swappable adapter (`src/lib/ledger/`) — `memory` default, `anvil` real.
- **Docs**: `docs/CONTEXT.md` (product PRD), `docs/TECHNICAL_PRD.md` (spec), `BUILD_PLAN.md` (roadmap + status).

## Status
**All phases complete** — see [`BUILD_PLAN.md`](BUILD_PLAN.md) and the 3-min walkthrough in
[`DEMO_SCRIPT.md`](DEMO_SCRIPT.md). The full golden path (file → classify → notice → SLA → provider →
escalate → dossier → resolver → mediation → PV → settled), the institutional API, the on-chain audit
timeline, and the Agency Benefit dashboard are all working. Real Solidity ledger in [`contracts/`](contracts/).
