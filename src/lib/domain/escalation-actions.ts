"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { escalateAndFileDossier } from "@/lib/domain/escalation";

export async function escalateAction(caseId: string, formData: FormData) {
  const user = await requireRole("claimant");
  if (formData.get("consent") !== "on") {
    throw new Error("sharing_consent_required");
  }
  await escalateAndFileDossier(caseId, user.id);
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath("/claimant");
}
