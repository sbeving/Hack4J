# Sulha — repo guide for AI agents

Bilingual (FR + Arabic RTL) claims/dispute platform for Tunisian MSMEs. Hackathon MVP.
Read `BUILD_PLAN.md` for scope/status and `docs/TECHNICAL_PRD.md` for the spec.

## Stack & conventions
- **Next.js 16 App Router + React 19 + TS + Tailwind v4**, `src/` dir, `@/*` → `src/*`.
- **Prisma is pinned to v6** (v7's rewritten CLI breaks `db push`). Do not upgrade.
- **SQLite has no enums** — string unions live in `src/lib/domain/constants.ts` and are the
  source of truth (roles, claim types, case states, the state machine `TRANSITIONS`).
- **Money is integer millimes** (`Int`, 1 TND = 1000). Format via `src/lib/money.ts`. Never floats.
- **Single `.env`** (gitignored) — read by both Next and the Prisma CLI. `.env.example` is the template.
- **AI** goes through `src/lib/ai/` (Claude via Azure Foundry, `AI_MODEL`). Never call the model inline.
  AI only *suggests*; humans confirm. No legal text is generated from model memory — slot-fill only.
- **Ledger** goes through the `src/lib/ledger/` adapter. `LEDGER=memory` is the reliable default.
- **Hashes** are keccak256 (`src/lib/hash.ts`, viem). Originals are immutable.

## Auth (demo)
Cookie session (`src/lib/session.ts`) + `loginAs`/`logout` server actions (`src/lib/actions.ts`).
Pages call `requireRole(role)`. Real access checks even though login is a demo picker.

## Gotchas
- `cookies()` is async (await it). Server Actions set cookies; Server Components only read.
- Puppeteer/Prisma are in `serverExternalPackages` (next.config.ts) — keep them server-only.
- Everything must stay cross-platform (a teammate is on Windows): npm scripts, no shell-specific tools.
