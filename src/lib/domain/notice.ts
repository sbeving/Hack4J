import "server-only";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/domain/events";
import { anchor } from "@/lib/ledger";
import { buildNoticeHtml, type NoticeFacts } from "@/lib/notice/template";
import { renderHtmlToPdf } from "@/lib/pdf/render";
import { saveArtifact } from "@/lib/storage";

const DEMO_SLA_MINUTES = parseInt(process.env.DEMO_SLA_MINUTES || "3", 10) || 3;
const DEFAULT_DEADLINE_DAYS = 15;

export async function generateNotice(caseId: string, userId: string) {
  const c = await prisma.case.findFirst({
    where: { id: caseId, claimantUserId: userId },
    include: { providerOrg: true, claimantUser: { include: { org: true } } },
  });
  if (!c) throw new Error("case_not_found");
  if (!["filed", "notice_sent", "provider_review"].includes(c.state)) {
    throw new Error("invalid_state_for_notice");
  }

  const facts: NoticeFacts = {
    caseNumber: c.caseNumber,
    claimType: c.claimType,
    claimantName: c.claimantUser.name,
    claimantOrg: c.claimantUser.org?.name ?? "—",
    providerName: c.providerOrg.name,
    amountMillimes: c.amountMillimes,
    reference: c.reference,
    claimDateISO: c.createdAt.toISOString(),
    deadlineDays: DEFAULT_DEADLINE_DAYS,
    city: "Tunis",
  };

  const { html, templateVersion } = buildNoticeHtml(facts);
  const pdf = await renderHtmlToPdf(html);

  const version = (await prisma.notice.count({ where: { caseId } })) + 1;
  const stored = await saveArtifact(`${caseId}/notice-v${version}.pdf`, pdf);

  const notice = await prisma.notice.create({
    data: {
      caseId,
      version,
      templateVersion,
      factsSnapshot: JSON.stringify(facts),
      pdfKey: stored.storageKey,
      contentHash: stored.contentHash,
      deadlineDays: facts.deadlineDays,
      legalBasis: "COC arts. 268-274, 278",
      status: "generated",
    },
  });

  await recordEvent(caseId, "notice_generated", {
    actor: userId,
    payload: { noticeId: notice.id, version, contentHash: stored.contentHash },
  });
  return notice;
}

export async function sendNotice(caseId: string, noticeId: string, userId: string) {
  const c = await prisma.case.findFirst({
    where: { id: caseId, claimantUserId: userId },
    include: { providerOrg: true },
  });
  if (!c) throw new Error("case_not_found");
  const notice = await prisma.notice.findFirst({ where: { id: noticeId, caseId } });
  if (!notice) throw new Error("notice_not_found");
  if (notice.status === "sent") return notice;

  const now = new Date();
  const slaDueAt = new Date(now.getTime() + DEMO_SLA_MINUTES * 60_000);
  const effectId = `deliv-${noticeId}`;
  const receipt = {
    channel: "provider_portal",
    effectId,
    acceptedAt: now.toISOString(),
    simulated: true,
  };

  const updated = await prisma.notice.update({
    where: { id: noticeId },
    data: { status: "sent", sentAt: now, deliveryReceipt: JSON.stringify(receipt) },
  });

  // Durable acceptance of the notice starts the operational SLA.
  await prisma.case.update({
    where: { id: caseId },
    data: {
      state: "notice_sent",
      slaStartedAt: now,
      slaDueAt,
      version: { increment: 1 },
    },
  });

  if (notice.contentHash) {
    await anchor({ caseId, subjectType: "notice", subjectId: noticeId, digest: notice.contentHash });
  }
  await recordEvent(caseId, "notice_sent", {
    actor: userId,
    payload: { noticeId, effectId, simulated: true },
  });
  await recordEvent(caseId, "sla_started", {
    actor: "system",
    payload: { slaDueAt: slaDueAt.toISOString(), demoMinutes: DEMO_SLA_MINUTES },
  });

  const agents = await prisma.user.findMany({
    where: { orgId: c.providerOrgId, role: "provider_agent" },
    select: { id: true },
  });
  if (agents.length) {
    await prisma.notification.createMany({
      data: agents.map((a) => ({
        userId: a.id,
        caseId,
        type: "notice_received",
        messageKey: "notif.notice_received",
        params: JSON.stringify({ caseNumber: c.caseNumber }),
      })),
    });
  }
  await prisma.notification.create({
    data: {
      userId,
      caseId,
      type: "notice_sent",
      messageKey: "notif.notice_sent",
      params: JSON.stringify({ caseNumber: c.caseNumber }),
    },
  });

  return updated;
}
