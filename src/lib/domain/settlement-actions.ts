"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { acknowledgeTerms } from "@/lib/domain/resolver";

export async function acknowledgeTermsAction(caseId: string, settlementId: string) {
  const s = await requireSession();
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) throw new Error("case_not_found");

  let party: "claimant" | "provider";
  if (s.role === "claimant" && c.claimantUserId === s.id) party = "claimant";
  else if (s.role === "provider_agent" && c.providerOrgId === s.orgId) party = "provider";
  else throw new Error("forbidden");

  await acknowledgeTerms(caseId, settlementId, party);
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath(`/provider/cases/${caseId}`);
  revalidatePath(`/institution/cases/${caseId}`);
}
