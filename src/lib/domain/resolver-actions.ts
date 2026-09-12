"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import * as Resolver from "@/lib/domain/resolver";
import { tndToMillimes } from "@/lib/money";

function revalidateAll(caseId: string) {
  revalidatePath(`/institution/cases/${caseId}`);
  revalidatePath("/institution");
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath(`/provider/cases/${caseId}`);
}

export async function acceptCaseAction(caseId: string) {
  const u = await requireRole("resolver");
  await Resolver.acceptCase(caseId, u.orgId ?? "", u.id);
  revalidateAll(caseId);
}

export async function scheduleMediationAction(caseId: string, formData: FormData) {
  const u = await requireRole("resolver");
  const raw = String(formData.get("scheduledAt") ?? "");
  if (!raw) throw new Error("date_required");
  await Resolver.scheduleMediation(caseId, u.orgId ?? "", u.id, new Date(raw).toISOString());
  revalidateAll(caseId);
}

export async function publishTermsAction(caseId: string, formData: FormData) {
  const u = await requireRole("resolver");
  const obligations = String(formData.get("obligations") ?? "").trim();
  const remedyType = String(formData.get("remedyType") ?? "correct_bill");
  const amountRaw = String(formData.get("amountTnd") ?? "").trim();
  const performanceDate = String(formData.get("performanceDate") ?? "").trim() || null;
  if (obligations.length < 3) throw new Error("obligations_required");
  await Resolver.publishTerms(caseId, u.orgId ?? "", u.id, {
    obligations,
    remedyType,
    amountMillimes: amountRaw ? tndToMillimes(parseFloat(amountRaw) || 0) : null,
    performanceDate,
  });
  revalidateAll(caseId);
}

export async function recordSettlementAction(caseId: string, settlementId: string) {
  const u = await requireRole("resolver");
  await Resolver.recordSettlement(caseId, u.orgId ?? "", u.id, settlementId);
  revalidateAll(caseId);
}

export async function closeUnsettledAction(caseId: string, formData: FormData) {
  const u = await requireRole("resolver");
  await Resolver.closeUnsettled(caseId, u.orgId ?? "", u.id, String(formData.get("reason") ?? "").trim() || "Aucun accord");
  revalidateAll(caseId);
}
