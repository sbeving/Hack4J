import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { readFile } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ noticeId: string }> }
) {
  const { noticeId } = await params;
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const notice = await prisma.notice.findUnique({
    where: { id: noticeId },
    include: { case: true },
  });
  if (!notice || !notice.pdfKey) return new Response("Not found", { status: 404 });

  const c = notice.case;
  const allowed =
    session.role === "admin" ||
    (session.role === "claimant" && c.claimantUserId === session.id) ||
    (session.role === "provider_agent" && c.providerOrgId === session.orgId) ||
    (session.role === "resolver" && c.institutionOrgId === session.orgId);
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const buf = await readFile(notice.pdfKey);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${c.caseNumber}-mise-en-demeure.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
