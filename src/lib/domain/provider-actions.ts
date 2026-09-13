"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/domain/events";
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

/** Provider's countersignature: after the claimant confirms, the provider confirms
 * the same terms → resolved ("Réglé (accord direct)"). Both entities have confirmed. */
export async function confirmResolutionAction(caseId: string) {
  const u = await requireRole("provider_agent");
  const c = await prisma.case.findFirst({
    where: { id: caseId, providerOrgId: u.orgId ?? "" },
    select: { id: true, state: true, caseNumber: true, claimantUserId: true },
  });
  if (!c || c.state !== "resolution_agreed") throw new Error("not_actionable");

  await prisma.case.update({
    where: { id: caseId },
    data: { state: "resolved", version: { increment: 1 } },
  });
  await recordEvent(caseId, "provider_confirmed_resolution", { actor: u.id });
  await prisma.notification.create({
    data: {
      userId: c.claimantUserId,
      caseId,
      type: "resolution_confirmed",
      messageKey: "notif.resolution_confirmed",
      params: JSON.stringify({ caseNumber: c.caseNumber }),
    },
  });
  revalidatePath(`/provider/cases/${caseId}`);
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath("/provider");
  revalidatePath("/claimant");
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
