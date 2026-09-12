"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import * as Notice from "@/lib/domain/notice";

export async function generateNoticeAction(caseId: string) {
  const user = await requireRole("claimant");
  await Notice.generateNotice(caseId, user.id);
  revalidatePath(`/claimant/cases/${caseId}`);
}

export async function sendNoticeAction(caseId: string, noticeId: string) {
  const user = await requireRole("claimant");
  await Notice.sendNotice(caseId, noticeId, user.id);
  revalidatePath(`/claimant/cases/${caseId}`);
  revalidatePath("/claimant");
}
