import "server-only";
import { z } from "zod";
import { AI_ENABLED, jsonComplete } from "@/lib/ai/client";

const SuggestionSchema = z.object({
  neutralSummary: z.string().default(""),
  suggestedResolution: z.string().default(""),
  suggestedRemedyType: z
    .enum(["correct_bill", "refund", "restore_service", "compensation", "reject"])
    .default("correct_bill"),
});

export type ResolutionSuggestion = z.infer<typeof SuggestionSchema> & {
  source: "ai" | "fallback";
};

const FALLBACK: ResolutionSuggestion = {
  neutralSummary: "Résumé IA indisponible — examinez les preuves manuellement.",
  suggestedResolution: "Vérifier la ligne contestée et proposer une régularisation si elle est justifiée.",
  suggestedRemedyType: "correct_bill",
  source: "fallback",
};

const SUGGEST_SYSTEM = `Tu assistes un agent d'un guichet de réclamations d'un fournisseur tunisien (STEG, SONEDE, La Poste...).
À partir d'une réclamation d'une PME et des preuves, produis :
- "neutralSummary": un résumé NEUTRE et factuel (une phrase en français), sans prendre parti.
- "suggestedResolution": une action de résolution concrète et raisonnable (français, une phrase). Non contraignante.
- "suggestedRemedyType": un parmi correct_bill, refund, restore_service, compensation, reject.
Retourne UNIQUEMENT: {"neutralSummary":"...","suggestedResolution":"...","suggestedRemedyType":"..."}`;

export async function suggestResolution(input: {
  claimType: string;
  narrative: string;
  amountTnd: number;
  providerName: string;
  evidence: { kind: string; summary: string }[];
}): Promise<ResolutionSuggestion> {
  if (!AI_ENABLED) return FALLBACK;
  try {
    const evidenceText =
      input.evidence.map((e) => `- [${e.kind}] ${e.summary}`).join("\n") || "aucune preuve";
    const raw = await jsonComplete<unknown>({
      system: SUGGEST_SYSTEM,
      content: `Fournisseur: ${input.providerName}\nType: ${input.claimType}\nMontant contesté: ${input.amountTnd} TND\nRéclamation: """${input.narrative}"""\nPreuves:\n${evidenceText}`,
      maxTokens: 700,
    });
    return { ...SuggestionSchema.parse(raw), source: "ai" };
  } catch {
    return FALLBACK;
  }
}
