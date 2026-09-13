"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/domain/events";
import { postMediationMessage, type Party } from "@/lib/domain/mediation";

/** Re-verify the caller is actually a party to this case (defense in depth). */
async function requireParty(caseId: string, party: Party) {
  if (party === "claimant") {
    const user = await requireRole("claimant");
    const c = await prisma.case.findFirst({
      where: { id: caseId, claimantUserId: user.id },
    });
    if (!c) throw new Error("forbidden");
    return { user, c };
  }
  const user = await requireRole("provider_agent");
  const c = await prisma.case.findFirst({
    where: { id: caseId, providerOrgId: user.orgId ?? "__none__" },
  });
  if (!c) throw new Error("forbidden");
  return { user, c };
}

function revalidateBoth(caseId: string) {
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath(`/provider/cases/${caseId}`);
}

export async function sendMediatorMessageAction(
  caseId: string,
  party: Party,
  formData: FormData
) {
  await requireParty(caseId, party);
  const text = String(formData.get("message") ?? "").trim();
  if (!text) return;
  if (text.length > 2000) throw new Error("message_too_long");
  await postMediationMessage(caseId, party, text);
  if (party === "claimant") {
    revalidatePath(`/claimant/cases/${caseId}`);
  } else {
    revalidatePath(`/provider/cases/${caseId}`);
  }
}

async function notifyOtherParty(
  party: Party,
  c: { id: string; caseNumber: string; claimantUserId: string; providerOrgId: string }
) {
  const type = "human_review_requested";
  if (party === "claimant") {
    // notify the provider's agents
    const agents = await prisma.user.findMany({
      where: { orgId: c.providerOrgId, role: "provider_agent" },
      select: { id: true },
    });
    if (agents.length) {
      await prisma.notification.createMany({
        data: agents.map((a) => ({
          userId: a.id,
          caseId: c.id,
          type,
          messageKey: `notif.${type}`,
          params: JSON.stringify({ caseNumber: c.caseNumber }),
        })),
      });
    }
  } else {
    await prisma.notification.create({
      data: {
        userId: c.claimantUserId,
        caseId: c.id,
        type,
        messageKey: `notif.${type}`,
        params: JSON.stringify({ caseNumber: c.caseNumber }),
      },
    });
  }
}

/**
 * A party asks for a human reviewer + full report. Records a SHARED event so the
 * request itself lands in the tamper-evident tracking log (and anchors to the
 * ledger), and notifies the other party. No state transition — the report is a
 * read, decoupled from the formal escalation-to-resolver flow.
 */
export async function requestHumanReviewAction(caseId: string, party: Party) {
  const { user, c } = await requireParty(caseId, party);
  await recordEvent(caseId, "human_review_requested", {
    actor: user.id,
    payload: { party },
    visibility: "shared",
  });
  await notifyOtherParty(party, c);
  revalidateBoth(caseId);
}
