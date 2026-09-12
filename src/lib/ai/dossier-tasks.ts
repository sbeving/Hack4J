import "server-only";
import { z } from "zod";
import { AI_ENABLED, jsonComplete } from "@/lib/ai/client";

const DossierSummarySchema = z.object({
  neutralSummary: z.string().default(""),
  claimantPosition: z.string().default(""),
  providerPosition: z.string().default(""),
  unresolvedIssues: z.array(z.string()).default([]),
});

export type DossierSummary = z.infer<typeof DossierSummarySchema> & {
  source: "ai" | "fallback";
};

const FALLBACK: DossierSummary = {
  neutralSummary: "Résumé neutre indisponible — à compléter par l'officier.",
  claimantPosition: "",
  providerPosition: "",
  unresolvedIssues: [],
  source: "fallback",
};

const SYSTEM = `Tu prépares un résumé NEUTRE pour un médiateur/officier de conciliation tunisien qui reçoit un dossier escaladé.
À partir de la réclamation, des preuves et des échanges, produis en français :
- "neutralSummary": un paragraphe factuel et impartial (2-3 phrases).
- "claimantPosition": la position du réclamant (une phrase).
- "providerPosition": la position du fournisseur si exprimée (une phrase, sinon "").
- "unresolvedIssues": liste courte des points factuels non résolus.
N'invente aucun fait. Reste neutre. Retourne UNIQUEMENT: {"neutralSummary":"...","claimantPosition":"...","providerPosition":"...","unresolvedIssues":["..."]}`;

export async function summarizeForDossier(input: {
  claimType: string;
  narrative: string;
  amountTnd: number;
  providerName: string;
  evidence: { kind: string; summary: string }[];
  responses: { kind: string; message: string | null }[];
}): Promise<DossierSummary> {
  if (!AI_ENABLED) return FALLBACK;
  try {
    const ev = input.evidence.map((e) => `- [${e.kind}] ${e.summary}`).join("\n") || "aucune";
    const resp =
      input.responses.map((r) => `- ${r.kind}: ${r.message ?? ""}`).join("\n") || "aucun échange";
    const raw = await jsonComplete<unknown>({
      system: SYSTEM,
      content: `Fournisseur: ${input.providerName}\nType: ${input.claimType}\nMontant: ${input.amountTnd} TND\nRéclamation: """${input.narrative}"""\nPreuves:\n${ev}\nÉchanges:\n${resp}`,
      maxTokens: 900,
    });
    return { ...DossierSummarySchema.parse(raw), source: "ai" };
  } catch {
    return FALLBACK;
  }
}
