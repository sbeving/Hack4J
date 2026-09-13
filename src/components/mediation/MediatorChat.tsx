"use client";

import { useEffect, useRef } from "react";
import { sendMediatorMessageAction } from "@/lib/domain/mediation-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/domain/constants";

type Msg = { id: string; role: string; text: string; source: string | null };

export function MediatorChat({
  caseId,
  party,
  messages,
  locale,
}: {
  caseId: string;
  party: "claimant" | "provider";
  messages: Msg[];
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear the input once a new turn arrives (server re-render pushes new props).
  useEffect(() => {
    formRef.current?.reset();
  }, [messages.length]);
  // Keep the latest turn in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const L = {
    title: isAr ? "الوسيط الآلي" : "Médiateur IA",
    caption: isAr ? "محايد · غير مُلزِم" : "Neutre · non contraignant",
    empty: isAr
      ? "اطرح سؤالاً على الوسيط الآلي لتقريب وجهات النظر."
      : "Posez une question au médiateur pour rapprocher les positions.",
    placeholder: isAr ? "اكتب رسالتك…" : "Écrivez votre message…",
    send: isAr ? "إرسال" : "Envoyer",
    sending: isAr ? "جارٍ الإرسال…" : "Envoi…",
    ai: isAr ? "الوسيط الآلي" : "Médiateur IA",
    fallback: isAr ? "تقريبي" : "repli",
  };

  return (
    <Card className="flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cobalt text-surface">
          <Icon name="handshake" size={18} />
        </span>
        <div className="leading-tight">
          <h3 className="text-[15px] font-semibold text-ink">{L.title}</h3>
          <span className="text-[11px] text-ink-muted">{L.caption}</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-[120px] max-h-[360px] flex-1 space-y-3 overflow-y-auto pe-1"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-cobalt-tint text-cobalt">
              <Icon name="handshake" size={22} />
            </span>
            <p className="max-w-[240px] text-sm text-ink-muted">{L.empty}</p>
          </div>
        ) : (
          messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <p
                    className="max-w-[85%] rounded-2xl rounded-se-sm bg-primary px-3.5 py-2.5 text-sm text-surface"
                    dir="auto"
                  >
                    {m.text}
                  </p>
                </div>
              );
            }
            return (
              <div key={m.id} className="flex items-start gap-2">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-cobalt-tint text-cobalt">
                  <Icon name="handshake" size={13} />
                </span>
                <div className="max-w-[85%] rounded-2xl rounded-ss-sm border border-cobalt/15 bg-surface px-3.5 py-2.5">
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-cobalt">{L.ai}</span>
                    {m.source === "fallback" ? <Badge tone="warning">{L.fallback}</Badge> : null}
                  </div>
                  <p className="text-sm text-ink" dir="auto">
                    {m.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        ref={formRef}
        action={sendMediatorMessageAction.bind(null, caseId, party)}
        className="mt-3 flex items-end gap-2 border-t border-border pt-3"
      >
        <textarea
          name="message"
          required
          rows={2}
          maxLength={2000}
          dir="auto"
          placeholder={L.placeholder}
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-cobalt focus:outline-none"
        />
        <SubmitButton variant="cobalt" pendingLabel={L.sending}>
          {L.send}
        </SubmitButton>
      </form>
    </Card>
  );
}
