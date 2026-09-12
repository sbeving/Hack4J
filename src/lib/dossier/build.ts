import "server-only";
import { fontFaceCss } from "@/lib/pdf/fonts";
import { formatMillimes } from "@/lib/money";
import type { DossierSummary } from "@/lib/ai/dossier-tasks";
import type { IntegrityStatus } from "@/lib/integrity";

export type DossierSnapshot = {
  caseNumber: string;
  snapshotId: string;
  generatedAt: string;
  throughEventSeq: number;
  demo: boolean;
  claimant: { name: string; org: string };
  provider: { name: string };
  institution: string | null;
  claimType: string;
  claimTypeLabel: string;
  amountMillimes: number;
  reference: string | null;
  requestedRemedy: string | null;
  narrative: string;
  escalationReason: string;
  timeline: { seq: number; type: string; actor: string | null; ts: string }[];
  evidence: {
    index: number;
    id: string;
    filename: string;
    kind: string;
    mime: string;
    byteCount: number;
    contentHash: string;
    integrity: IntegrityStatus;
    anchorId: string | null;
    summary: string;
  }[];
  notice: {
    version: number;
    sentAt: string | null;
    deadlineDays: number;
    contentHash: string | null;
    simulated: boolean;
  } | null;
  responses: {
    kind: string;
    message: string | null;
    remedyType: string | null;
    amountMillimes: number | null;
    claimantDisposition: string | null;
    createdAt: string;
  }[];
  summary: DossierSummary;
};

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const INTEGRITY_LABEL: Record<IntegrityStatus, string> = {
  matched: "✓ intègre",
  mismatch: "⚠ ALTÉRÉ",
  unavailable: "— non vérifiable",
};

export function buildDossierHtml(s: DossierSnapshot): string {
  const fdate = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-TN") : "—");

  const section = (n: number, title: string, body: string) => `
    <section class="sec">
      <h2>${n}. ${esc(title)}</h2>
      ${body}
    </section>`;

  const coverRows = [
    ["Référence dossier", s.caseNumber],
    ["Réclamant", `${s.claimant.name} — ${s.claimant.org}`],
    ["Fournisseur", s.provider.name],
    ["Institution", s.institution ?? "—"],
    ["Type de litige", s.claimTypeLabel],
    ["Montant contesté", formatMillimes(s.amountMillimes, "fr")],
    ["Réparation demandée", s.requestedRemedy ?? "—"],
    ["Instantané (snapshot)", `${s.snapshotId} · ${fdate(s.generatedAt)}`],
  ]
    .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join("");

  const timelineRows = s.timeline
    .map((e) => `<tr><td>${e.seq}</td><td>${fdate(e.ts)}</td><td>${esc(e.type)}</td><td>${esc(e.actor ?? "—")}</td></tr>`)
    .join("");

  const evidenceIndex = s.evidence
    .map((e) => `<tr><td>${e.index}</td><td>${esc(e.filename)}</td><td>${esc(e.kind)}</td><td>${e.byteCount} o</td></tr>`)
    .join("");

  const manifestRows = s.evidence
    .map(
      (e) =>
        `<tr><td>${e.index}</td><td class="mono">${esc(e.contentHash.slice(0, 18))}…</td><td>${INTEGRITY_LABEL[e.integrity]}</td><td class="mono">${esc(e.anchorId ? e.anchorId.slice(0, 12) + "…" : "en attente")}</td></tr>`
    )
    .join("");

  const responsesRows =
    s.responses.length > 0
      ? s.responses
          .map(
            (r) =>
              `<tr><td>${esc(r.kind)}</td><td>${esc(r.message ?? "—")}</td><td>${r.amountMillimes != null ? esc(formatMillimes(r.amountMillimes, "fr")) : "—"}</td><td>${esc(r.claimantDisposition ?? "—")}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="4">Aucun échange partagé.</td></tr>`;

  const unresolved =
    s.summary.unresolvedIssues.length > 0
      ? `<ul>${s.summary.unresolvedIssues.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
      : "<p>—</p>";

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    ${fontFaceCss()}
    *{box-sizing:border-box}
    body{margin:0;font-family:'Noto Serif',Georgia,serif;font-size:11px;color:#1a1a1a;line-height:1.55}
    .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #6D28D9;padding-bottom:8px}
    .brand{font-weight:700;color:#6D28D9;font-size:15px}
    .brand .ar{font-family:'Noto Sans Arabic',sans-serif}
    .title{text-align:center;font-size:15px;font-weight:700;margin:10px 0 2px;letter-spacing:.04em}
    .subtitle{text-align:center;font-size:10px;color:#666;margin-bottom:6px}
    .ribbon{background:#fef3c7;border:1px solid #f59e0b;color:#92400e;font-size:9px;font-weight:700;text-align:center;padding:3px;border-radius:4px;margin:6px 0}
    .sec{margin-top:12px;break-inside:avoid}
    .sec h2{font-size:12px;color:#6D28D9;border-bottom:1px solid #ede9fe;padding-bottom:2px;margin:0 0 5px}
    table{width:100%;border-collapse:collapse;font-size:10px}
    td,th{border:1px solid #e5e7eb;padding:4px 6px;text-align:left;vertical-align:top}
    th{background:#f5f3ff;color:#5b21b6}
    td.k{font-weight:700;width:34%;background:#faf9ff}
    .mono{font-family:ui-monospace,Menlo,monospace}
    .narrative{white-space:pre-wrap;background:#faf9ff;border:1px solid #ede9fe;border-radius:5px;padding:6px}
    .foot{margin-top:14px;border-top:1px solid #e5e7eb;padding-top:6px;font-size:8.5px;color:#777}
  </style></head><body>
    <div class="hd">
      <div class="brand"><span class="ar">صلح</span> Sulha</div>
      <div style="text-align:right;font-size:9px;color:#555">Dossier ${esc(s.caseNumber)}<br/>${fdate(s.generatedAt)}</div>
    </div>
    <div class="title">DOSSIER STANDARDISÉ DE RÉCLAMATION</div>
    <div class="subtitle">ملفّ مطلب موحّد — transmis au module institutionnel neutre</div>
    <div class="ribbon">DÉMONSTRATION — données synthétiques, non validé juridiquement</div>

    ${section(1, "Feuille de couverture", `<table>${coverRows}</table>`)}
    ${section(2, "Faits confirmés et objet", `<div class="narrative">${esc(s.narrative)}</div><p style="margin-top:6px">Motif d'escalade : <b>${esc(s.escalationReason)}</b></p>`)}
    ${section(3, "Chronologie", `<table><tr><th>#</th><th>Date (système)</th><th>Événement</th><th>Acteur</th></tr>${timelineRows}</table>`)}
    ${section(4, "Index des preuves", `<table><tr><th>#</th><th>Fichier</th><th>Type</th><th>Taille</th></tr>${evidenceIndex || '<tr><td colspan="4">Aucune preuve.</td></tr>'}</table>`)}
    ${section(5, "Manifeste d'intégrité", `<table><tr><th>#</th><th>keccak256</th><th>Vérification</th><th>Réf. registre</th></tr>${manifestRows || '<tr><td colspan="4">—</td></tr>'}</table>`)}
    ${section(6, "Mise en demeure et preuve d'envoi", s.notice ? `<table><tr><td class="k">Version</td><td>v${s.notice.version}</td></tr><tr><td class="k">Envoyée le</td><td>${fdate(s.notice.sentAt)} ${s.notice.simulated ? "(livraison simulée)" : ""}</td></tr><tr><td class="k">Délai</td><td>${s.notice.deadlineDays} jours</td></tr><tr><td class="k">Empreinte</td><td class="mono">${esc(s.notice.contentHash ?? "—")}</td></tr></table>` : "<p>Aucune mise en demeure envoyée.</p>")}
    ${section(7, "Réponses et échanges", `<table><tr><th>Type</th><th>Message</th><th>Montant</th><th>Décision client</th></tr>${responsesRows}</table>`)}
    ${section(8, "Résumé neutre et action demandée", `<p><b>Résumé :</b> ${esc(s.summary.neutralSummary)}</p><p><b>Position réclamant :</b> ${esc(s.summary.claimantPosition || "—")}</p><p><b>Position fournisseur :</b> ${esc(s.summary.providerPosition || "—")}</p><p><b>Points non résolus :</b></p>${unresolved}<p style="margin-top:6px;color:#888">Résumé assisté par IA — l'officier vérifie avant adoption.</p>`)}

    <div class="foot">Sulha · Dossier généré automatiquement à des fins de démonstration. Base légale invoquée : COC arts. 268-274, 278 (à valider). snapshot=${esc(s.snapshotId)} · through_event_sequence=${s.throughEventSeq}</div>
  </body></html>`;
}

export function buildDossierJson(s: DossierSnapshot): Record<string, unknown> {
  return {
    schemaVersion: "sulha-dossier-1.0",
    caseNumber: s.caseNumber,
    snapshotId: s.snapshotId,
    generatedAt: s.generatedAt,
    throughEventSequence: s.throughEventSeq,
    demo: s.demo,
    parties: {
      claimant: s.claimant,
      provider: s.provider,
      institution: s.institution,
    },
    claim: {
      type: s.claimType,
      amountMillimes: s.amountMillimes,
      currency: "TND",
      reference: s.reference,
      requestedRemedy: s.requestedRemedy,
      narrative: s.narrative,
      escalationReason: s.escalationReason,
      legalBasis: "COC arts. 268-274, 278 (à valider)",
    },
    timeline: s.timeline,
    evidenceManifest: s.evidence.map((e) => ({
      index: e.index,
      filename: e.filename,
      kind: e.kind,
      mime: e.mime,
      byteCount: e.byteCount,
      contentHash: e.contentHash,
      integrity: e.integrity,
      anchorId: e.anchorId,
    })),
    notice: s.notice,
    responses: s.responses,
    neutralSummary: {
      text: s.summary.neutralSummary,
      claimantPosition: s.summary.claimantPosition,
      providerPosition: s.summary.providerPosition,
      unresolvedIssues: s.summary.unresolvedIssues,
      aiAssisted: true,
    },
  };
}
