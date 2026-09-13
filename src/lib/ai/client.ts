import "server-only";
import { AnthropicFoundry } from "@anthropic-ai/foundry-sdk";
import type Anthropic from "@anthropic-ai/sdk";

/** ON when explicitly enabled or when Foundry credentials are configured (same gate as OCR). */
export const AI_ENABLED =
  process.env.AI_ENABLED === "true" ||
  Boolean(String(process.env.ANTHROPIC_FOUNDRY_API_KEY ?? "").trim());
export const AI_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

let _client: AnthropicFoundry | null = null;

export function ai(): AnthropicFoundry {
  if (!_client) {
    _client = new AnthropicFoundry({
      // Builds https://{resource}.services.ai.azure.com/anthropic/v1/messages
      // (resource and baseURL are mutually exclusive in the Foundry SDK).
      resource: process.env.FOUNDRY_RESOURCE,
      apiKey: process.env.ANTHROPIC_FOUNDRY_API_KEY,
      maxRetries: 1,
    });
  }
  return _client;
}

/** Strip ```json fences and parse. Throws on invalid JSON. */
export function parseJsonLoose<T = unknown>(text: string): T {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Grab the outermost object if there's leading/trailing prose.
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first > 0 || last < s.length - 1) s = s.slice(first, last + 1);
  return JSON.parse(s) as T;
}

/** Extract concatenated text from a Messages response. */
export function textOf(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

type Content = string | Anthropic.ContentBlockParam[];

/**
 * One JSON-returning completion. No thinking (opus-4-8 runs without it when
 * omitted — fast + cheap for extraction/classification), no temperature/prefill
 * (both 400 on 4.8). Retries once nudging for valid JSON, then throws.
 */
export async function jsonComplete<T>(opts: {
  system: string;
  content: Content;
  maxTokens?: number;
}): Promise<T> {
  const { system, content, maxTokens = 2000 } = opts;
  const client = ai();

  const attempt = async (extra?: string): Promise<T> => {
    const userContent: Content =
      typeof content === "string"
        ? extra
          ? `${content}\n\n${extra}`
          : content
        : extra
          ? [...content, { type: "text", text: extra }]
          : content;

    const msg = await client.messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    });
    return parseJsonLoose<T>(textOf(msg));
  };

  try {
    return await attempt();
  } catch {
    return await attempt("Return ONLY a single valid JSON object. No prose, no markdown fences.");
  }
}

/** Plain-text completion — used when JSON shape is optional (e.g. mediator chat). */
export async function textComplete(opts: {
  system: string;
  content: Content;
  maxTokens?: number;
}): Promise<string> {
  const { system, content, maxTokens = 1000 } = opts;
  const client = ai();
  const msg = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content }],
  });
  return textOf(msg).trim();
}
