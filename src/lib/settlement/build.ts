import "server-only";
import { fontFaceCss } from "@/lib/pdf/fonts";
import { formatMillimes } from "@/lib/money";

export type SettlementSnapshot = {
  caseNumber: string;
  generatedAt: string;
  claimant: string;
  provider: string;
  institution: string;
  mediator: string;
  scheduledAt: string | null;
  obligations: string;
  remedyTypeLabel: string;
  amountMillimes: number | null;
  performanceDate: string | null;
  acknowledgements: { party: string; at: string }[];
  termsHash: string;
};

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildSettlementHtml(s: SettlementSnapshot): string {
  const fdate = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-TN") : "—");
  const ackRows =
    s.acknowledgements.length > 0
      ? s.acknowledgements.map((a) => `<tr><td>${esc(a.party)}</td><td>${fdate(a.at)}</td></tr>`).join("")
      : `<tr><td colspan="2">Aucun accusé enregistré.</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    ${fontFaceCss()}
    *{box-sizing:border-box}
    body{margin:0;font-family:'Noto Serif',Georgia,serif;font-size:12px;color:#1a1a1a;line-height:1.7}
    .hd{display:flex;justify-content:space-between;border-bottom:2px solid #6D28D9;padding-bottom:8px}
    .brand{font-weight:700;color:#6D28D9;font-size:15px}
    .brand .ar{font-family:'Noto Sans Arabic',sans-serif}
    .title{text-align:center;font-size:16px;font-weight:700;margin:14px 0 2px;text-decoration:underline}
    .subtitle{text-align:center;font-size:11px;color:#666}
    .ribbon{background:#fef3c7;border:1px solid #f59e0b;color:#92400e;font-size:10px;font-weight:700;text-align:center;padding:5px;border-radius:5px;margin:10px 0}
    table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px}
    td,th{border:1px solid #e5e7eb;padding:5px 8px;text-align:left}
    td.k{font-weight:700;width:34%;background:#faf9ff}
    .obl{background:#faf9ff;border:1px solid #ede9fe;border-radius:6px;padding:10px;white-space:pre-wrap}
    .sign{display:flex;justify-content:space-between;margin-top:28px}
    .sign div{width:30%;border-top:1px solid #999;padding-top:4px;font-size:10px;text-align:center}
    .foot{margin-top:16px;border-top:1px solid #e5e7eb;padding-top:8px;font-size:9px;color:#777}
    .mono{font-family:ui-monospace,Menlo,monospace}
  </style></head><body>
    <div class="hd">
      <div class="brand"><span class="ar">مفاهمة</span> Moufehma</div>
      <div style="text-align:right;font-size:10px;color:#555">${esc(s.caseNumber)}<br/>${fdate(s.generatedAt)}</div>
    </div>
    <div class="title">PV DE CONCILIATION</div>
    <div class="subtitle">محضر صلح — Règlement amiable</div>
    <div class="ribbon">PROJET DE PROCÈS-VERBAL — DÉMONSTRATION · non signé électroniquement (ANCE), non exécutoire</div>

    <table>
      <tr><td class="k">Institution</td><td>${esc(s.institution)}</td></tr>
      <tr><td class="k">Officier / Médiateur</td><td>${esc(s.mediator)}</td></tr>
      <tr><td class="k">Réclamant</td><td>${esc(s.claimant)}</td></tr>
      <tr><td class="k">Fournisseur</td><td>${esc(s.provider)}</td></tr>
      <tr><td class="k">Séance de médiation</td><td>${fdate(s.scheduledAt)}</td></tr>
    </table>

    <p><b>Termes de l'accord :</b></p>
    <div class="obl">${esc(s.obligations)}</div>
    <table>
      <tr><td class="k">Type de réparation</td><td>${esc(s.remedyTypeLabel)}</td></tr>
      <tr><td class="k">Montant</td><td>${s.amountMillimes != null ? esc(formatMillimes(s.amountMillimes, "fr")) : "—"}</td></tr>
      <tr><td class="k">Échéance d'exécution</td><td>${s.performanceDate ? esc(s.performanceDate) : "—"}</td></tr>
      <tr><td class="k">Empreinte des termes</td><td class="mono">${esc(s.termsHash)}</td></tr>
    </table>

    <p><b>Accusés de réception des parties :</b></p>
    <table><tr><th>Partie</th><th>Date</th></tr>${ackRows}</table>

    <div class="sign">
      <div>Le réclamant</div>
      <div>Le fournisseur</div>
      <div>Le médiateur</div>
    </div>

    <div class="foot">Moufehma · Projet de PV généré à des fins de démonstration. Un clic « accuser réception » enregistre une intention dans Moufehma ; il ne vaut ni signature ANCE, ni paiement, ni décision exécutoire. La compétence de l'institution et le modèle de PV doivent être validés.</div>
  </body></html>`;
}
