import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { readFile } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ settlementId: string }> }
) {
  const { settlementId } = await params;
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: { mediation: { include: { case: true } } },
  });
  if (!settlement || !settlement.pdfKey) return new Response("Not found", { status: 404 });

  const c = settlement.mediation.case;
  const allowed =
    session.role === "admin" ||
    (session.role === "claimant" && c.claimantUserId === session.id) ||
    (session.role === "provider_agent" && c.providerOrgId === session.orgId) ||
    (session.role === "resolver" && c.institutionOrgId === session.orgId);
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const buf = await readFile(settlement.pdfKey);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${c.caseNumber}-pv-conciliation.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
