import "dotenv/config";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { AnthropicFoundry } from "@anthropic-ai/foundry-sdk";

const BILL_HTML = `<!doctype html><html><head><meta charset="utf-8"/><style>
  *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
  body{margin:0;background:#fff;color:#111;font-size:14px}
  .sheet{width:760px;margin:0 auto;padding:28px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0B6BB2;padding-bottom:12px}
  .logo{font-size:26px;font-weight:800;color:#0B6BB2;letter-spacing:1px}
  .logo small{display:block;font-size:11px;color:#555;font-weight:600}
  .doc{ text-align:right;font-size:12px;color:#444}
  h1{font-size:17px;margin:18px 0 4px;text-transform:uppercase;letter-spacing:.5px}
  .ar{font-family:'Geeza Pro','Arial';direction:rtl;color:#0B6BB2;font-weight:700}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin:14px 0;font-size:13px}
  .grid div span{color:#666}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
  th,td{border:1px solid #ddd;padding:8px 10px;text-align:left}
  th{background:#eef4fa;color:#0B6BB2}
  td.r,th.r{text-align:right}
  .total{margin-top:14px;display:flex;justify-content:flex-end}
  .total .box{border:2px solid #0B6BB2;border-radius:8px;padding:10px 18px;font-size:18px;font-weight:800;color:#0B6BB2}
  .flag{margin-top:8px;background:#fff4e5;border:1px solid #f0a500;color:#a15c00;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600}
  .foot{margin-top:20px;font-size:11px;color:#777;border-top:1px solid #eee;padding-top:8px}
</style></head><body><div class="sheet">
  <div class="top">
    <div class="logo">STEG<small>Société Tunisienne de l'Électricité et du Gaz</small></div>
    <div class="doc"><span class="ar">فاتورة الكهرباء</span><br/>Facture N° <b>FA-2026-004512</b><br/>Émise le 05/09/2026</div>
  </div>
  <h1>Facture d'électricité — Basse Tension</h1>
  <div class="grid">
    <div><span>Client :</span> <b>Atelier Amira (menuiserie)</b></div>
    <div><span>N° contrat :</span> <b>STEG-4471-00892</b></div>
    <div><span>Adresse :</span> Rue de l'Artisanat, Sfax</div>
    <div><span>Période :</span> 01/08/2026 – 31/08/2026</div>
    <div><span>Réf. compteur :</span> 77-334-221</div>
    <div><span>Tarif :</span> Professionnel BT</div>
  </div>
  <table>
    <tr><th>Désignation</th><th class="r">Index ancien</th><th class="r">Index nouveau</th><th class="r">Conso (kWh)</th><th class="r">Montant (TND)</th></tr>
    <tr><td>Consommation électricité</td><td class="r">12 450</td><td class="r">12 980</td><td class="r">530</td><td class="r">318,500</td></tr>
    <tr><td>Prime de puissance</td><td class="r">—</td><td class="r">—</td><td class="r">—</td><td class="r">42,000</td></tr>
    <tr><td><b>Régularisation période antérieure</b></td><td class="r">—</td><td class="r">—</td><td class="r">—</td><td class="r"><b>900,000</b></td></tr>
    <tr><td>TVA + redevances</td><td class="r">—</td><td class="r">—</td><td class="r">—</td><td class="r">89,700</td></tr>
  </table>
  <div class="total"><div class="box">Total à payer : 1 350,200 TND</div></div>
  <div class="flag">⚠ Ligne « Régularisation période antérieure » : 900,000 TND — atelier fermé pour congé sur la période concernée.</div>
  <div class="foot">STEG — Service Facturation · Réclamations sous 15 jours · Ce document est un modèle de démonstration.</div>
</div></body></html>`;

async function main() {
  const outDir = path.join(process.cwd(), "public/demo");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 820, height: 1000, deviceScaleFactor: 2 });
  await page.setContent(BILL_HTML, { waitUntil: "load" });
  const billPath = path.join(outDir, "steg-facture.png");
  await page.screenshot({ path: billPath, fullPage: true });
  await browser.close();
  console.log("Wrote", billPath, fs.statSync(billPath).size, "bytes");

  // Vision extraction test against Foundry.
  const b64 = fs.readFileSync(billPath).toString("base64");
  const client = new AnthropicFoundry({
    resource: process.env.FOUNDRY_RESOURCE,
    apiKey: process.env.ANTHROPIC_FOUNDRY_API_KEY,
  });
  const msg = await client.messages.create({
    model: process.env.AI_MODEL || "claude-opus-4-8",
    max_tokens: 1000,
    system:
      'Extract structured data. Return ONLY JSON: {"documentKind":"bill","summary":"one FR sentence","amountTnd":number|null,"reference":string|null,"providerName":string|null,"documentDate":string|null,"fields":[{"label":"...","value":"..."}]}. The disputed amount is the "Régularisation période antérieure" line.',
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: b64 } },
          { type: "text", text: "Extract the structured data from this Tunisian electricity bill." },
        ],
      },
    ],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  console.log("VISION EXTRACTION:\n", text);
}

main().catch((e) => {
  console.error("FAIL:", e?.status ?? "", e?.message ?? e);
  process.exit(1);
});
