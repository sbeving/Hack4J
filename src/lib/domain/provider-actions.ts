"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import * as Provider from "@/lib/domain/provider";
import { tndToMillimes } from "@/lib/money";

export async function acknowledgeAction(caseId: string) {
  const u = await requireRole("provider_agent");
  await Provider.providerRespond({
    caseId,
    agentId: u.id,
    orgId: u.orgId ?? "",
    kind: "acknowledge",
  });
  revalidatePath(`/provider/cases/${caseId}`);
  revalidatePath("/provider");
}

export async function requestInfoAction(caseId: string, formData: FormData) {
  const u = await requireRole("provider_agent");
  await Provider.providerRespond({
    caseId,
    agentId: u.id,
    orgId: u.orgId ?? "",
    kind: "request_info",
    message: String(formData.get("message") ?? "").trim(),
  });
  revalidatePath(`/provider/cases/${caseId}`);
}

export async function contestAction(caseId: string, formData: FormData) {
  const u = await requireRole("provider_agent");
  await Provider.providerRespond({
    caseId,
    agentId: u.id,
    orgId: u.orgId ?? "",
    kind: "contest",
    message: String(formData.get("message") ?? "").trim(),
  });
  revalidatePath(`/provider/cases/${caseId}`);
  revalidatePath("/provider");
}

export async function proposeRemedyAction(caseId: string, formData: FormData) {
  const u = await requireRole("provider_agent");
  const amountTnd = parseFloat(String(formData.get("amountTnd") ?? "0")) || 0;
  await Provider.providerRespond({
    caseId,
    agentId: u.id,
    orgId: u.orgId ?? "",
    kind: "propose_remedy",
    message: String(formData.get("message") ?? "").trim(),
    remedyType: String(formData.get("remedyType") ?? "correct_bill"),
    amountMillimes: tndToMillimes(amountTnd),
  });
  revalidatePath(`/provider/cases/${caseId}`);
  revalidatePath("/provider");
}
