import "server-only";
import { z } from "zod";
import { AI_ENABLED, jsonComplete } from "@/lib/ai/client";

// ── Negotiation brief (shared, neutral) ──────────────────────────────────────
// A single neutral read of where the claimant ↔ provider negotiation stands,
// with a concrete suggested compromise and a nudge tailored to each party.
// Advisory only — humans still fire every transition (see CLAUDE.md).

const BriefSchema = z.object({
  neutralSummary: z.string().default(""),
  gapAnalysis: z.string().default(""),
  suggestedCompromise: z
    .object({
      remedyType: z
        .enum(["correct_bill", "refund", "restore_service", "compensation"])
        .default("correct_bill"),
      amountTnd: z.number().nullable().default(null),
      rationale: z.string().default(""),
    })
    .default({ remedyType: "correct_bill", amountTnd: null, rationale: "" }),
  claimantNudge: z.string().default(""),
  providerNudge: z.string().default(""),
  readiness: z.enum(["far", "close", "aligned"]).default("far"),
});

export type MediationBrief = z.infer<typeof BriefSchema> & {
  source: "ai" | "fallback";
};

const BRIEF_FALLBACK: MediationBrief = {
  neutralSummary: "Médiation IA indisponible — poursuivez l'échange directement.",
  gapAnalysis: "",
  suggestedCompromise: { remedyType: "correct_bill", amountTnd: null, rationale: "" },
  claimantNudge:
    "Exposez clairement le montant contesté et la solution que vous attendez.",
  providerNudge:
    "Vérifiez la ligne contestée et proposez une régularisation si elle est justifiée.",
  readiness: "far",
  source: "fallback",
};

const BRIEF_SYSTEM = `Tu es un MÉDIATEUR IA NEUTRE entre une PME tunisienne (réclamant) et un fournisseur (STEG, SONEDE, La Poste, opérateur...).
Ton rôle: aider les deux parties à trouver un accord amiable AVANT toute escalade vers un médiateur humain. Tu ne décides rien, tu ne rédiges aucun texte juridique.
À partir de la réclamation, des preuves et des échanges, produis en français :
- "neutralSummary": où en est la négociation, factuel et impartial (1-2 phrases).
- "gapAnalysis": l'écart entre les deux positions (ex: montant demandé vs proposé), une phrase.
- "suggestedCompromise": un compromis concret et raisonnable = { "remedyType": un parmi correct_bill|refund|restore_service|compensation, "amountTnd": nombre en TND ou null si sans objet, "rationale": une phrase justifiant le compromis }.
- "claimantNudge": conseil bref et neutre au réclamant pour avancer vers l'accord (une phrase).
- "providerNudge": conseil bref et neutre au fournisseur pour avancer vers l'accord (une phrase).
- "readiness": "far" | "close" | "aligned" selon la distance restante vers un accord.
N'invente aucun fait. Reste strictement neutre — ne favorise aucune partie.
Retourne UNIQUEMENT un objet JSON avec exactement ces clés.`;

export async function mediateNegotiation(input: {
  claimType: string;
  narrative: string;
  amountTnd: number;
  providerName: string;
  requestedRemedy?: string | null;
  evidence: { kind: string; summary: string }[];
  exchanges: {
    kind: string;
    message: string | null;
    remedyType?: string | null;
    amountTnd?: number | null;
    disposition?: string | null;
  }[];
}): Promise<MediationBrief> {
  if (!AI_ENABLED) return BRIEF_FALLBACK;
  try {
    const ev =
      input.evidence.map((e) => `- [${e.kind}] ${e.summary}`).join("\n") || "aucune";
    const ex =
      input.exchanges
        .map((r) => {
          const amount = r.amountTnd != null ? ` (${r.amountTnd} TND)` : "";
          const remedy = r.remedyType ? ` [${r.remedyType}]` : "";
          const dispo = r.disposition && r.disposition !== "pending" ? ` → ${r.disposition}` : "";
          return `- ${r.kind}${remedy}${amount}: ${r.message ?? ""}${dispo}`;
        })
        .join("\n") || "aucun échange pour l'instant";
    const raw = await jsonComplete<unknown>({
      system: BRIEF_SYSTEM,
      content: `Fournisseur: ${input.providerName}
Type: ${input.claimType}
Montant contesté: ${input.amountTnd} TND
Demande initiale du réclamant: ${input.requestedRemedy ?? "non précisée"}
Réclamation: """${input.narrative}"""
Preuves:
${ev}
Historique des échanges:
${ex}`,
      maxTokens: 900,
    });
    return { ...BriefSchema.parse(raw), source: "ai" };
  } catch {
    return BRIEF_FALLBACK;
  }
}

// ── Mediator chat (per-party, advisory) ──────────────────────────────────────
// Conversational follow-up. Guard-railed: neutral, non-binding, references only
// the confirmed facts, and never drafts legal/binding documents.

const ReplySchema = z.object({ reply: z.string().default("") });

export type MediatorReply = { reply: string; source: "ai" | "fallback" };

const CHAT_FALLBACK: MediatorReply = {
  reply:
    "Le médiateur IA est momentanément indisponible. Vous pouvez poursuivre l'échange directement avec l'autre partie.",
  source: "fallback",
};

const CHAT_SYSTEM = `Tu es un MÉDIATEUR IA NEUTRE dans un litige entre une PME tunisienne (réclamant) et un fournisseur.
Tu discutes avec UNE des deux parties pour l'aider à comprendre la situation et à avancer vers un accord amiable.
Règles STRICTES :
- Reste neutre et impartial. Ne prends jamais parti.
- Réponds brièvement (2-3 phrases), en français clair (le tunisien/derja est accepté en entrée).
- Appuie-toi uniquement sur les faits fournis (réclamation, preuves, échanges, compromis suggéré). N'invente aucun fait ni aucun montant.
- Oriente vers le compromis suggéré quand c'est pertinent, mais laisse la décision à l'humain.
- Tu ne rédiges AUCUN document juridique (ni mise en demeure, ni PV, ni contrat) et tu ne donnes pas de conseil juridique contraignant.
- Rappelle au besoin que l'accord final doit être confirmé par les deux parties, et qu'un réviseur humain peut être saisi sur demande.
Retourne UNIQUEMENT: {"reply":"..."}`;

export async function mediatorChatReply(input: {
  party: "claimant" | "provider";
  history: { role: "user" | "assistant"; text: string }[];
  userMessage: string;
  context: {
    claimType: string;
    narrative: string;
    amountTnd: number;
    providerName: string;
    brief?: MediationBrief | null;
  };
}): Promise<MediatorReply> {
  if (!AI_ENABLED) return CHAT_FALLBACK;
  try {
    const partyLabel = input.party === "claimant" ? "le réclamant (PME)" : "le fournisseur";
    const briefText = input.context.brief
      ? `Compromis suggéré: ${input.context.brief.suggestedCompromise.remedyType}` +
        (input.context.brief.suggestedCompromise.amountTnd != null
          ? ` ${input.context.brief.suggestedCompromise.amountTnd} TND`
          : "") +
        ` — ${input.context.brief.suggestedCompromise.rationale}`
      : "Aucun compromis calculé pour l'instant.";
    const convo =
      input.history
        .slice(-8)
        .map((m) => `${m.role === "user" ? partyLabel : "Médiateur IA"}: ${m.text}`)
        .join("\n") || "(début de la conversation)";
    const raw = await jsonComplete<unknown>({
      system: CHAT_SYSTEM,
      content: `Tu parles avec ${partyLabel}.
Contexte du litige — Fournisseur: ${input.context.providerName} · Type: ${input.context.claimType} · Montant contesté: ${input.context.amountTnd} TND
Réclamation: """${input.context.narrative}"""
${briefText}
Conversation récente:
${convo}
Nouveau message de ${partyLabel}: """${input.userMessage}"""`,
      maxTokens: 500,
    });
    const parsed = ReplySchema.parse(raw);
    return { reply: parsed.reply || CHAT_FALLBACK.reply, source: "ai" };
  } catch {
    return CHAT_FALLBACK;
  }
}
