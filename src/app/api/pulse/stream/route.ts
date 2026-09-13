import { getSession } from "@/lib/session";
import { readPulse } from "@/lib/realtime/pulse";
import { subscribeCaseChanges } from "@/lib/realtime/bus";

// Server-sent events: the browser holds one connection open and we push a new
// pulse the moment the case changes. `<LiveRefresh>` turns that into a refresh.
export const dynamic = "force-dynamic";

const SAFETY_CHECK_MS = 2000; // catches writes that bypass the in-process bus
const KEEPALIVE_MS = 25000;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const caseId = new URL(req.url).searchParams.get("caseId");
  const first = await readPulse(caseId, session);
  if (!first) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let last = first;
      let closed = false;
      let reading = false;

      const send = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          close();
        }
      };

      const push = async () => {
        if (closed || reading) return;
        reading = true;
        try {
          const pulse = await readPulse(caseId, session);
          if (pulse && pulse !== last) {
            last = pulse;
            send(`data: ${pulse}\n\n`);
          }
        } catch {
          // Transient database error — the next check retries.
        } finally {
          reading = false;
        }
      };

      const unsubscribe = subscribeCaseChanges(caseId, () => void push());
      const safety = setInterval(() => void push(), SAFETY_CHECK_MS);
      const keepalive = setInterval(() => send(": ping\n\n"), KEEPALIVE_MS);

      function close() {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(safety);
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {
          // Already closed by the runtime.
        }
      }

      send(`data: ${first}\n\n`);
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
