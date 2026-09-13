import "server-only";
import fs from "fs";
import path from "path";
import { fontFaceCss } from "@/lib/pdf/fonts";
import { formatMillimes } from "@/lib/money";

type LangText = { fr: string; ar: string };
type Clauses = {
  templateVersion: string;
  disclaimer: LangText;
  notice: {
    title: LangText;
    salutation: LangText;
    bodyByClaimType: Record<string, LangText>;
    legalBasis: LangText;
    deadlineClause: LangText;
    consequences: LangText;
    closing: LangText;
  };
};

let clausesCache: Clauses | null = null;
function clauses(): Clauses {
  if (!clausesCache) {
    clausesCache = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "legal/clauses.json"), "utf-8")
    ) as Clauses;
  }
  return clausesCache;
}

export type NoticeFacts = {
  caseNumber: string;
  claimType: string;
  claimantName: string;
  claimantOrg: string;
  providerName: string;
  amountMillimes: number;
  reference: string | null;
  claimDateISO: string;
  deadlineDays: number;
  city: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fill(tpl: string, slots: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => esc(slots[k] ?? "—")).replace(/\n/g, "<br/>");
}

export function buildNoticeHtml(facts: NoticeFacts): {
  html: string;
  templateVersion: string;
} {
  const c = clauses();
  const bodyKey = c.notice.bodyByClaimType[facts.claimType] ? facts.claimType : "billing_error";
  const body = c.notice.bodyByClaimType[bodyKey];

  const frDate = new Date().toLocaleDateString("fr-TN", { day: "2-digit", month: "long", year: "numeric" });
  const arDate = new Date().toLocaleDateString("ar-TN-u-nu-latn", { day: "numeric", month: "long", year: "numeric" });
  const frClaim = new Date(facts.claimDateISO).toLocaleDateString("fr-TN");
  const arClaim = new Date(facts.claimDateISO).toLocaleDateString("ar-TN-u-nu-latn");

  const base = {
    claimantName: facts.claimantName,
    claimantOrg: facts.claimantOrg,
    providerName: facts.providerName,
    reference: facts.reference ?? "—",
    deadlineDays: String(facts.deadlineDays),
    city: facts.city,
  };
  const frSlots = { ...base, amount: formatMillimes(facts.amountMillimes, "fr"), claimDate: frClaim, date: frDate };
  const arSlots = { ...base, amount: formatMillimes(facts.amountMillimes, "ar"), claimDate: arClaim, date: arDate };

  const section = (lang: "fr" | "ar", slots: Record<string, string>) => {
    const rtl = lang === "ar";
    return `
      <section class="notice ${rtl ? "ar" : "fr"}" ${rtl ? 'dir="rtl"' : ""}>
        <h2 class="title">${esc(c.notice.title[lang])}</h2>
        <p class="salutation">${fill(c.notice.salutation[lang], slots)}</p>
        <p class="body">${fill(body[lang], slots)}</p>
        <p class="legal">${fill(c.notice.legalBasis[lang], slots)}</p>
        <p class="deadline">${fill(c.notice.deadlineClause[lang], slots)}</p>
        <p class="consequences">${fill(c.notice.consequences[lang], slots)}</p>
        <p class="closing">${fill(c.notice.closing[lang], slots)}</p>
      </section>`;
  };

  const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
    ${fontFaceCss()}
    * { box-sizing: border-box; }
    body { margin: 0; color: #1a1a1a; font-family: 'Noto Serif', Georgia, serif; font-size: 12.5px; line-height: 1.7; }
    .sheet { padding: 4px 2px; }
    .doc-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #3730a3; padding-bottom:8px; margin-bottom:6px; }
    .brand { font-weight:700; color:#3730a3; font-size:15px; }
    .brand .ar { font-family:'Noto Sans Arabic', sans-serif; }
    .ref { text-align:right; font-size:10.5px; color:#555; }
    .demo-ribbon { background:#fef3c7; border:1px solid #f59e0b; color:#92400e; font-size:10px; font-weight:700; text-align:center; padding:4px; border-radius:5px; margin:8px 0; letter-spacing:0.04em; }
    .notice { padding:10px 2px; }
    .notice.ar { font-family:'Noto Sans Arabic', sans-serif; font-size:13px; }
    .divider { border:0; border-top:1px dashed #cbd5e1; margin:14px 0; }
    .title { font-size:16px; font-weight:700; text-align:center; letter-spacing:0.06em; margin:0 0 12px; text-decoration:underline; }
    .notice.ar .title { letter-spacing:0; }
    .salutation { font-weight:700; margin:0 0 10px; }
    .body, .legal, .deadline, .consequences { margin:0 0 10px; text-align:justify; }
    .legal { font-style:italic; color:#333; }
    .deadline { font-weight:700; }
    .closing { margin-top:16px; white-space:normal; }
    .disclaimer { margin-top:14px; border-top:1px solid #e2e8f0; padding-top:8px; font-size:9px; color:#64748b; }
    .disclaimer .ar { font-family:'Noto Sans Arabic', sans-serif; direction:rtl; display:block; margin-top:4px; }
  </style></head><body><div class="sheet">
    <div class="doc-header">
      <div class="brand"><span class="ar">مفاهمة</span> Moufehma</div>
      <div class="ref">Réf. ${esc(facts.caseNumber)}<br/>${esc(frDate)}</div>
    </div>
    <div class="demo-ribbon">DOCUMENT DE DÉMONSTRATION — NON VALIDÉ JURIDIQUEMENT · نموذج تجريبي غير مُصادَق عليه قانونيًّا</div>
    ${section("fr", frSlots)}
    <hr class="divider"/>
    ${section("ar", arSlots)}
    <div class="disclaimer">
      ${esc(c.disclaimer.fr)}
      <span class="ar">${esc(c.disclaimer.ar)}</span>
    </div>
  </div></body></html>`;

  return { html, templateVersion: c.templateVersion };
}
