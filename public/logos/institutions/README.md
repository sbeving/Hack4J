# Tunisian institution logos

Ready for Claude to use in the existing Next.js app. All eight institutions have a PNG; STEG, Tunisie Telecom, and RNE also have SVGs. Files are local and need no remote image configuration.

Folder: `public/logos/institutions/`

Use the paths below as image `src` values. Preserve aspect ratios with `object-fit: contain`; do not stretch or recolor. Most originals are compact web assets, so prefer SVG where available and display raster logos at modest sizes.

| Institution | PNG URL | SVG URL |
|---|---|---|
| STEG | `/logos/institutions/steg.png` | `/logos/institutions/steg.svg` |
| SONEDE | `/logos/institutions/sonede.png` | — |
| Tunisie Telecom | `/logos/institutions/tunisie-telecom.png` | `/logos/institutions/tunisie-telecom.svg` |
| CNSS | `/logos/institutions/cnss.png` | — |
| La Poste Tunisienne | `/logos/institutions/la-poste-tunisienne.png` | — |
| RNE | `/logos/institutions/rne.png` | `/logos/institutions/rne.svg` |
| APII | `/logos/institutions/apii.png` | — |
| APIA | `/logos/institutions/apia.png` | — |

## APA naming

“APA” in the request has been interpreted as **APIA**, the Agence de Promotion des Investissements Agricoles. `apa.png` is an exact copy of `apia.png`; it is not a separate institution logo.

## Sources and preview

- `preview.png`: visual contact sheet of all eight logos.
- `logos.json`: exact source URLs, image dimensions, display names, and transformation notes.
- APII was cropped from its official site’s header banner.
- STEG’s inline SVG uses its official site’s blue/red CSS colors, embedded so it works standalone.
- PNGs for vector originals were rendered locally; original SVG geometry is retained.
- Assets were obtained from the institutions’ official websites. `la-poste-tunisienne.gif` is an additional alternate downloaded from STEG’s official partner directory; prefer `la-poste-tunisienne.png` from La Poste itself.
