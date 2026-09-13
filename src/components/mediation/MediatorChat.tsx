"use client";

import { useEffect, useRef } from "react";
import { sendMediatorMessageAction } from "@/lib/domain/mediation-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Badge, cn } from "@/components/ui";
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

  // Clear the input once a new turn arrives (server re-render pushes new props).
  useEffect(() => {
    formRef.current?.reset();
  }, [messages.length]);

  const L = {
    title: isAr ? "اسأل الوسيط الآلي" : "Demander au médiateur IA",
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
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-cobalt-tint text-cobalt">
          <Icon name="send" size={16} />
        </span>
        <h3 className="text-[15px] font-semibold text-ink">{L.title}</h3>
      </div>

      {messages.length === 0 ? (
        <p className="rounded-lg bg-surface-sand p-3 text-sm text-ink-muted">{L.empty}</p>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    isUser ? "bg-primary-tint text-ink" : "bg-cobalt-tint text-ink"
                  )}
                >
                  {!isUser ? (
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-cobalt">{L.ai}</span>
                      {m.source === "fallback" ? <Badge tone="warning">{L.fallback}</Badge> : null}
                    </div>
                  ) : null}
                  <p dir="auto">{m.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form
        ref={formRef}
        action={sendMediatorMessageAction.bind(null, caseId, party)}
        className="mt-3 flex items-end gap-2"
      >
        <textarea
          name="message"
          required
          rows={2}
          maxLength={2000}
          dir="auto"
          placeholder={L.placeholder}
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none"
        />
        <SubmitButton variant="cobalt" pendingLabel={L.sending}>
          {L.send}
        </SubmitButton>
      </form>
    </Card>
  );
}
