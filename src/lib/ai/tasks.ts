import "server-only";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { AI_ENABLED, jsonComplete } from "@/lib/ai/client";
import {
  CLAIM_TYPES,
  type ClaimType,
  type Priority,
} from "@/lib/domain/constants";

// ── Evidence extraction ──────────────────────────────────────────────────────
const ExtractionSchema = z.object({
  documentKind: z.string().default("other"),
  summary: z.string().default(""),
  amountTnd: z.number().nullable().default(null),
  reference: z.string().nullable().default(null),
  providerName: z.string().nullable().default(null),
  documentDate: z.string().nullable().default(null),
  fields: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        uncertainty: z.enum(["confident", "needs_review"]).default("needs_review"),
      })
    )
    .default([]),
});

export type Extraction = z.infer<typeof ExtractionSchema> & {
  source: "ai" | "fallback";
};

const EXTRACT_SYSTEM = `You are a meticulous document-understanding assistant for a Tunisian MSME claims platform.
You read bills, receipts, contracts, delivery slips, emails and chat screenshots that mix Arabic, French and Tunisian Derja.
Rules:
- NEVER invent a value. If something is not clearly present, use null and mark uncertainty "needs_review".
- Amounts are Tunisian Dinar (TND). Return the single most relevant disputed/total amount as a number in TND (e.g. 900.000 -> 900).
- "summary" is one concise French sentence describing the document.
Return ONLY a JSON object with this exact shape:
{"documentKind":"bill|receipt|contract|chat|email|photo|other","summary":"...","amountTnd":number|null,"reference":string|null,"providerName":string|null,"documentDate":string|null,"fields":[{"label":"...","value":"...","uncertainty":"confident|needs_review"}]}`;

function extractionFallback(kind: string): Extraction {
  return {
    documentKind: kind || "other",
    summary: "Extraction IA indisponible — vérifiez et saisissez les champs manuellement.",
    amountTnd: null,
    reference: null,
    providerName: null,
    documentDate: null,
    fields: [],
    source: "fallback",
  };
}

export async function extractEvidence(input: {
  kind: string;
  mime: string;
  base64?: string; // for image/pdf
  text?: string; // for text/markdown
}): Promise<Extraction> {
  if (!AI_ENABLED) return extractionFallback(input.kind);

  try {
    let content: Anthropic.ContentBlockParam[];
    if (input.mime.startsWith("image/") && input.base64) {
      content = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: input.mime as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
            data: input.base64,
          },
        },
        { type: "text", text: "Extract the structured data from this document." },
      ];
    } else if (input.mime === "application/pdf" && input.base64) {
      content = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: input.base64 },
        },
        { type: "text", text: "Extract the structured data from this document." },
      ];
    } else {
      const body = (input.text ?? "").slice(0, 20000);
      content = [
        { type: "text", text: `Extract the structured data from this document:\n\n"""\n${body}\n"""` },
      ];
    }

    const raw = await jsonComplete<unknown>({
      system: EXTRACT_SYSTEM,
      content,
      maxTokens: 1500,
    });
    const parsed = ExtractionSchema.parse(raw);
    return { ...parsed, source: "ai" };
  } catch {
    return extractionFallback(input.kind);
  }
}

// ── Claim classification & routing ───────────────────────────────────────────
const ClassificationSchema = z.object({
  claimType: z.enum(CLAIM_TYPES as unknown as [ClaimType, ...ClaimType[]]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  rationale: z.string().default(""),
});

export type Classification = z.infer<typeof ClassificationSchema> & {
  source: "ai" | "fallback";
};

const CLASSIFY_SYSTEM = `You classify a commercial dispute a Tunisian MSME raises against a service provider (STEG electricity/gas, SONEDE water, La Poste, telecom, delivery).
Choose exactly one claimType from: billing_error, service_interruption, delivery_failure, deposit_refund, service_damage.
Choose a priority: low, normal, high, urgent (urgent = ongoing service cut affecting the business, or large amount).
Return ONLY: {"claimType":"...","priority":"...","rationale":"one short French sentence"}`;

function heuristicClaimType(text: string): ClaimType {
  const t = text.toLowerCase();
  if (/livr|colis|to, ?صيل|توصيل|expéd|paquet/.test(t)) return "delivery_failure";
  if (/coupur|interrupt|انقطاع|rétabl|panne|électric|كهرباء|ماء|eau/.test(t)) return "service_interruption";
  if (/caution|rembours|dépôt|ضمان|استرجاع/.test(t)) return "deposit_refund";
  if (/dommage|dégât|abîm|ضرر|تلف/.test(t)) return "service_damage";
  return "billing_error";
}

export async function classifyClaim(input: {
  narrative: string;
  providerName?: string;
}): Promise<Classification> {
  if (!AI_ENABLED) {
    return {
      claimType: heuristicClaimType(input.narrative),
      priority: "normal",
      rationale: "Classification par défaut (IA désactivée).",
      source: "fallback",
    };
  }
  try {
    const raw = await jsonComplete<unknown>({
      system: CLASSIFY_SYSTEM,
      content: `Fournisseur: ${input.providerName ?? "inconnu"}\nRéclamation: """${input.narrative}"""`,
      maxTokens: 400,
    });
    const parsed = ClassificationSchema.parse(raw);
    return { ...parsed, source: "ai" };
  } catch {
    return {
      claimType: heuristicClaimType(input.narrative),
      priority: "normal",
      rationale: "Classification par défaut (repli).",
      source: "fallback",
    };
  }
}
