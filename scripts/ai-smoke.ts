import "dotenv/config";
import { AnthropicFoundry } from "@anthropic-ai/foundry-sdk";

async function main() {
  const client = new AnthropicFoundry({
    resource: process.env.FOUNDRY_RESOURCE,
    apiKey: process.env.ANTHROPIC_FOUNDRY_API_KEY,
  });

  const msg = await client.messages.create({
    model: process.env.AI_MODEL || "claude-opus-4-8",
    max_tokens: 300,
    system: "Return ONLY valid JSON.",
    messages: [
      {
        role: "user",
        content:
          'Classify this Tunisian MSME complaint and return {"claimType":"...","priority":"..."}: "STEG m\'a facturé 900 dinars de trop ce mois-ci."',
      },
    ],
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  console.log("MODEL:", msg.model);
  console.log("STOP:", msg.stop_reason);
  console.log("USAGE:", JSON.stringify(msg.usage));
  console.log("TEXT:", text);
}

main().catch((e) => {
  console.error("AI SMOKE FAILED:", e?.status ?? "", e?.message ?? e);
  process.exit(1);
});
