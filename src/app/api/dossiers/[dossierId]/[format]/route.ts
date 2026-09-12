import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { readFile } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dossierId: string; format: string }> }
) {
  const { dossierId, format } = await params;
  if (format !== "pdf" && format !== "json") return new Response("Not found", { status: 404 });

  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: { case: true },
  });
  if (!dossier) return new Response("Not found", { status: 404 });

  const c = dossier.case;
  const allowed =
    session.role === "admin" ||
    (session.role === "claimant" && c.claimantUserId === session.id) ||
    (session.role === "provider_agent" && c.providerOrgId === session.orgId) ||
    (session.role === "resolver" && c.institutionOrgId === session.orgId);
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const key = format === "json" ? dossier.jsonKey : dossier.pdfKey;
  if (!key) return new Response("Not found", { status: 404 });

  const buf = await readFile(key);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": format === "json" ? "application/json; charset=utf-8" : "application/pdf",
      "Content-Disposition": `inline; filename="${c.caseNumber}-dossier.${format}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
