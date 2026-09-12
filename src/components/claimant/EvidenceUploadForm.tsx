"use client";

import { useRef } from "react";
import { addEvidenceAction } from "@/lib/domain/claim-actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { Locale } from "@/lib/domain/constants";

export function EvidenceUploadForm({
  caseId,
  locale,
}: {
  caseId: string;
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await addEvidenceAction(caseId, fd);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-slate-50 p-4"
    >
      <input
        type="file"
        name="file"
        required
        accept=".png,.jpg,.jpeg,.pdf,.txt,.md,image/*,application/pdf"
        className="text-sm file:me-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
      />
      <SubmitButton pendingLabel={isAr ? "استخراج بالذكاء الاصطناعي…" : "Extraction IA…"}>
        {isAr ? "رفع + تحليل" : "Téléverser + analyser"}
      </SubmitButton>
    </form>
  );
}
