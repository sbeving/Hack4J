# Moufehma — Institutional Public API Hook

Two authenticated REST endpoints let a mediation / consumer-protection institution's own
system pull escalated claims from Moufehma. This is the "Public API Hook" mandatory module (F8).

**Auth:** `Authorization: Bearer <INSTITUTION_API_TOKEN>` (per-institution hashed credentials in
production; a single static demo token maps to the seeded institution here). No token → `401`.

Base URL (dev): `http://localhost:3000`

## 1. List assigned claims

```bash
curl -s -H "Authorization: Bearer $INSTITUTION_API_TOKEN" \
  http://localhost:3000/api/v1/institutional/claims
```

Returns the institution-scoped queue:

```json
{
  "count": 1,
  "claims": [
    {
      "caseId": "…",
      "caseNumber": "SLH-DEMO-004",
      "state": "dossier_filed",
      "claimType": "billing_error",
      "amountMillimes": 900000,
      "currency": "TND",
      "claimantOrg": "Atelier Amira (menuiserie)",
      "provider": "STEG — …",
      "escalationReason": "Contestation du fournisseur",
      "dossier": {
        "snapshotId": "…",
        "bundleHash": "0x…",
        "filedAt": "…",
        "detail": "/api/v1/institutional/claims/{caseId}"
      }
    }
  ]
}
```

## 2. Get one claim + live integrity check

```bash
curl -s -H "Authorization: Bearer $INSTITUTION_API_TOKEN" \
  http://localhost:3000/api/v1/institutional/claims/{caseId}
```

Returns the case, the dossier metadata (incl. `bundleHash` and secure artifact links), the full
machine-readable dossier (`dossierData`, same snapshot as the PDF), and a **server-recomputed
integrity check** of every evidence file:

```json
{
  "case": { "caseNumber": "SLH-DEMO-004", "state": "dossier_filed", "…": "…" },
  "dossier": { "snapshotId": "…", "bundleHash": "0x…",
    "artifacts": { "pdf": "/api/dossiers/{id}/pdf", "json": "/api/dossiers/{id}/json" } },
  "integrityCheck": { "allMatched": true,
    "evidence": [ { "filename": "…", "contentHash": "0x…", "integrity": "matched" } ] },
  "dossierData": { "schemaVersion": "sulha-dossier-1.0", "…": "…" },
  "verificationInstructions":
    "Recompute keccak256 of each evidence file and compare to contentHash; recompute bundleHash = keccak256(keccak256('SULHA_DOSSIER_V1') || pdfDigest || jsonDigest)."
}
```

Artifact links (`/api/dossiers/...`, `/api/notices/...`, `/api/settlements/...`) authorize via the
session cookie of a case participant; the JSON payload above is self-contained for machine use.
