"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/domain/events";
import * as Cases from "@/lib/domain/cases";
import { tndToMillimes } from "@/lib/money";
import type { ClaimType } from "@/lib/domain/constants";

export async function createClaimAction(formData: FormData) {
  const user = await requireRole("claimant");
  const providerOrgId = String(formData.get("providerOrgId") ?? "").trim();
  const narrative = String(formData.get("narrative") ?? "").trim();
  const claimType = String(formData.get("claimType") ?? "auto");
  const amountTnd = parseFloat(String(formData.get("amountTnd") ?? "0")) || 0;
  const reference = String(formData.get("reference") ?? "").trim() || undefined;
  const requestedRemedy = String(formData.get("requestedRemedy") ?? "").trim() || undefined;

  if (!providerOrgId || narrative.length < 5) {
    throw new Error("Fournisseur et description requis.");
  }

  const created = await Cases.createClaim({
    userId: user.id,
    providerOrgId,
    claimType: claimType as ClaimType | "auto",
    narrative,
    amountMillimes: tndToMillimes(amountTnd),
    reference,
    requestedRemedy,
  });

  redirect(`/claimant/cases/${created.id}`);
}

export async function addEvidenceAction(caseId: string, formData: FormData) {
  const user = await requireRole("claimant");
  const owns = await prisma.case.findFirst({
    where: { id: caseId, claimantUserId: user.id },
    select: { id: true },
  });
  if (!owns) throw new Error("case_not_found");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > 10 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 10 Mo).");

  const buffer = Buffer.from(await file.arrayBuffer());
  await Cases.addEvidence({
    caseId,
    userId: user.id,
    filename: file.name,
    mime: file.type || "application/octet-stream",
    buffer,
  });
  revalidatePath(`/claimant/cases/${caseId}`);
}

export async function confirmEvidenceAction(caseId: string, evidenceId: string) {
  const user = await requireRole("claimant");
  const ev = await prisma.evidence.findFirst({
    where: { id: evidenceId, caseId, case: { claimantUserId: user.id } },
  });
  if (!ev) throw new Error("evidence_not_found");
  await prisma.evidence.update({
    where: { id: evidenceId },
    data: { reviewState: "confirmed" },
  });
  await recordEvent(caseId, "evidence_confirmed", {
    actor: user.id,
    payload: { evidenceId },
  });
  revalidatePath(`/claimant/cases/${caseId}`);
}

export async function submitClaimAction(caseId: string) {
  const user = await requireRole("claimant");
  await Cases.submitClaim(caseId, user.id);
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath("/claimant");
}

async function notifyProviderAgents(
  providerOrgId: string,
  caseId: string,
  caseNumber: string,
  type: string
) {
  const agents = await prisma.user.findMany({
    where: { orgId: providerOrgId, role: "provider_agent" },
    select: { id: true },
  });
  if (agents.length) {
    await prisma.notification.createMany({
      data: agents.map((a) => ({
        userId: a.id,
        caseId,
        type,
        messageKey: `notif.${type}`,
        params: JSON.stringify({ caseNumber }),
      })),
    });
  }
}

export async function acceptRemedyAction(caseId: string, responseId: string) {
  const user = await requireRole("claimant");
  const c = await prisma.case.findFirst({ where: { id: caseId, claimantUserId: user.id } });
  if (!c || c.state !== "resolution_proposed") throw new Error("not_actionable");
  const resp = await prisma.providerResponse.findFirst({
    where: { id: responseId, caseId, kind: "remedy_proposal" },
  });
  if (!resp) throw new Error("proposal_not_found");

  await prisma.providerResponse.update({
    where: { id: responseId },
    data: { claimantDisposition: "accepted" },
  });
  await prisma.case.update({
    where: { id: caseId },
    data: { state: "resolved", version: { increment: 1 } },
  });
  await recordEvent(caseId, "claimant_accepted_remedy", { actor: user.id, payload: { responseId } });
  await notifyProviderAgents(c.providerOrgId, caseId, c.caseNumber, "remedy_accepted");
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath("/claimant");
}

export async function declineRemedyAction(caseId: string, responseId: string) {
  const user = await requireRole("claimant");
  const c = await prisma.case.findFirst({ where: { id: caseId, claimantUserId: user.id } });
  if (!c || c.state !== "resolution_proposed") throw new Error("not_actionable");

  await prisma.providerResponse.update({
    where: { id: responseId },
    data: { claimantDisposition: "declined" },
  });
  await prisma.case.update({
    where: { id: caseId },
    data: { state: "provider_review", version: { increment: 1 } },
  });
  await recordEvent(caseId, "claimant_declined_remedy", { actor: user.id, payload: { responseId } });
  await notifyProviderAgents(c.providerOrgId, caseId, c.caseNumber, "remedy_declined");
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath("/claimant");
}
