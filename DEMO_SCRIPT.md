# Moufehma — Demo Script (≈3 min)

## Before the demo
```bash
npm run db:reset     # wipe + seed (4 demo accounts + 15 historical cases for analytics)
npm run dev          # http://localhost:3000
```
Have the demo bill image ready to upload: `public/demo/steg-facture.png`.
Optional real chain: set `LEDGER=anvil` (+ deploy `contracts/`, see contracts/README.md); default `memory` needs nothing.

**Demo accounts** (landing page): 🧑‍🔧 Amira (MSME), 🏢 Sami (STEG desk), ⚖️ Karim (mediator), 🛠️ Admin.

## The hook (0:00–0:20)
> "A Sfax workshop is overbilled 900 TND by STEG — a monopoly. No alternative provider, and a lawyer costs more than the dispute. Watch Amira contest it in minutes, and settle it on the record."

## File → classify → notice (0:20–1:05) — **Amira**
1. **Nouvelle réclamation** → provider **STEG**, type **Détection auto (IA)**, tap 🎤 **Dicter** (Derja), amount **900**, ref **STEG-4471-00892** → **Créer**.
   → *AI classifies* to "Erreur de facturation" → routed to *Service Facturation*. **[F1, F3]**
2. Upload **steg-facture.png** → *Claude vision extracts* the 900 TND "Régularisation" line; **keccak256 hash + "hash intègre"** badge. **[F2]**
3. **Déposer** → **Générer la mise en demeure** → open the **bilingual AR/FR PDF** (COC arts. 268-274/278, 15-day deadline) → **Envoyer**. **[F4]**
   → Delivery-app **tracker** advances + live **SLA countdown** starts. **[F5]**

## Provider + escalation (1:05–1:40)
4. **Sami (STEG)**: open the claim → sees verified evidence + **AI neutral summary + suggested resolution** → click **Contester**. **[F6]**
5. **Amira**: the case is now escalatable → tick consent → **Escalader** → one click builds the **standardized dossier (PDF + JSON + integrity manifest + bundle hash)**. **[F7]**

## Neutral resolver + settlement (1:40–2:15) — **Karim**
6. **/institution** → open the dossier: **tamper-check** (recomputed keccak256), **AI neutral summary of both positions**, download **Dossier PDF/JSON**. **[F8]**
7. **Accepter** → **Programmer la médiation** → **Publier les termes** ("STEG annule les 900 TND…") → **Enregistrer le règlement** → **PV de Conciliation** PDF (labeled draft, non-ANCE). Case = **Réglé**.
8. Scroll the **Registre d'audit (on-chain)**: every event anchored with a tx hash + block. **[F9]**

## Public API + Agency Benefit (2:15–3:00)
9. Institutional **Public API Hook** (curl live):
   ```bash
   curl -s -H "Authorization: Bearer sulha-demo-institution-2026" \
     http://localhost:3000/api/v1/institutional/claims | jq
   ```
   → structured escalated claims + `bundleHash` + live integrity check. **[F8 · 2 endpoints]**
10. **Admin** dashboard → **The Agency Benefit**: ≈ hours + paper folders + exchanges saved × caseload, transparent assumptions. **[Agency Benefit]**

> Close: "Neutral, paperless, verifiable — an MSME just settled a dispute against a monopoly, out of court, on the record."

## Reset between runs
`npm run db:reset` (historical analytics stays; live case is recreated).
