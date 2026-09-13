import { getSession } from "@/lib/session";
import { readPulse } from "@/lib/realtime/pulse";

/** One-shot pulse read — the safety net behind the SSE stream. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const caseId = new URL(req.url).searchParams.get("caseId");
  const pulse = await readPulse(caseId, session);
  if (!pulse) return new Response("Not found", { status: 404 });

  return Response.json({ pulse }, { headers: { "Cache-Control": "private, no-store" } });
}
