# Sijill — Sulha Design System

**Concept:** *The Reconciliation Ledger.* A Tunisian civic institution that issues verifiable
settlements, built on the grammar of the official seal (cachet) pressed onto document paper.
**A keccak256 anchor = a wax seal on a page.** Light-mode only.

**Semantic law:** teal = platform/active · cobalt = neutral mediator · cachet-red = official/verified
(≤5% of pixels — marks & rings only) · manuscript gold = ornament **lines** only · olive = resolved.

## Color tokens (`src/app/globals.css`)
| Token (Tailwind class) | Hex | Use |
|---|---|---|
| `paper` | `#FBFAF6` | page ground (never `#fff`, never cream `#F4F1EA`) |
| `surface` | `#FFFFFF` | cards, tables, forms |
| `surface-sand` | `#F1ECE0` | letterhead bands, footers, empty states (sparing) |
| `ink` | `#18211D` | text (warm green-black, never `#000`) |
| `ink-muted` | `#556158` | secondary text, captions |
| `primary` / `primary-deep` / `primary-tint` | `#1E7A82` / `#0F5259` / `#E1EFEF` | teal — the institution |
| `cobalt` / `cobalt-tint` | `#1F4E9B` / `#DEE6F3` | neutral / mediator / resolver |
| `seal` / `seal-deep` | `#C8102E` / `#9E1B2F` | the cachet — verified/official; danger |
| `gold` | `#B8892B` | khatam rules & seal rings — **stroke only**, never fill/text |
| `success` / `success-tint` | `#5C7A3E` / … | resolved / settled |
| `warning` / `warning-tint` | `#D06A2C` / … | alerts only (the only orange) |
| `border` / `border-strong` | `#E4DDCE` / `#D6CBB5` | warm sand hairlines |

## Type
- **Bricolage Grotesque** — display/headings + "Sulha" wordmark (`font-display`).
- **IBM Plex Sans** — body/UI/labels (`font-sans`, tnum figures global).
- **IBM Plex Sans Arabic** — all Arabic, RTL (`font-arabic`, auto via `:lang(ar)`).
- **Reem Kufi** — the `صلح` seal glyph only (`font-kufi`).
- Arabic: never letter-spaced, more leading; logical properties everywhere (`ms/me/ps/pe/start/end`).

## Shape & depth
- Radius: `rounded-lg` 6px (controls) · `rounded-xl` 12px (cards) · `rounded-2xl` 16px (modals) · `rounded-full` (dots/chips).
- Borders carry separation. Two shadows only: `card`/`card-flat` utilities (static), `overlay` (menus/modals).
- Spacing on the 4/8 grid.

## Components
- `@/components/ui`: `Card`, `PageTitle`, `SectionHead` (normal-case, **no ALL-CAPS eyebrow**), `Button`
  (`primary|outline|ghost|danger|cobalt`, `size`, `icon`), `Badge` (tones + `dot`), `StatusDot`,
  `StatTile`, `Field`/`Input`/`Textarea`/`Select`, `DemoBadge`.
- `@/components/Icon`: bespoke 24-grid / 1.75-stroke line set (**no emoji, ever**).
- `@/components/brand`: `Seal`, `Wordmark`, `KhatamStar`, `KhatamField` (the eight-point motif).

## Motif — the Khatam eight-point star
Gold/red are **lines & marks only**. `KhatamField` watermark at 4-8% opacity on hero/letterhead/empty
states. The `.gold-rule` hairline separates letterhead from content.

## Motion
One orchestrated moment: **the Cachet Stamp** (`.animate-cachet`) on settlement/anchor. Everything else
is quiet 150ms feedback — no `-translate-y` lifts, no shadow jumps. `prefers-reduced-motion` respected.

## Banned (AI tells — purge on sight)
Generic indigo · emoji-as-icons · ALL-CAPS tracked eyebrows · middle-dot `A · B · C` meta chrome ·
`font-mono` on hashes · gradient washes · identical-card monotony with one universal shadow ·
`→` appended to buttons.
