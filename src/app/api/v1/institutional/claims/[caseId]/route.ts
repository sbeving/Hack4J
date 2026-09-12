import { authenticateInstitution, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { verifyMany } from "@/lib/integrity";
import { readFile } from "@/lib/storage";

// GET /api/v1/institutional/claims/{caseId} — authorized dossier + live integrity check (bearer).
export async function GET(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const auth = await authenticateInstitution(req);
  if (!auth) return unauthorized();

  const { caseId } = await params;
  const c = await prisma.case.findFirst({
    where: { id: caseId, institutionOrgId: auth.orgId },
    include: {
      evidence: { orderBy: { createdAt: "asc" } },
      dossiers: { orderBy: { createdAt: "desc" } },
      claimantUser: { include: { org: true } },
      providerOrg: true,
    },
  });
  if (!c) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const integrity = await verifyMany(c.evidence);
  const evidenceIntegrity = c.evidence.map((e) => ({
    filename: e.filename,
    contentHash: e.contentHash,
    integrity: integrity.get(e.id) ?? "unavailable",
  }));
  const allMatched = evidenceIntegrity.length > 0 && evidenceIntegrity.every((e) => e.integrity === "matched");

  const dossier = c.dossiers[0] ?? null;
  let dossierData: unknown = null;
  if (dossier?.jsonKey) {
    try {
      dossierData = JSON.parse((await readFile(dossier.jsonKey)).toString("utf-8"));
    } catch {
      dossierData = null;
    }
  }

  return Response.json({
    case: {
      caseId: c.id,
      caseNumber: c.caseNumber,
      state: c.state,
      claimType: c.claimType,
      amountMillimes: c.amountMillimes,
      currency: c.currency,
      escalationReason: c.escalationReason,
      claimantOrg: c.claimantUser.org?.name ?? null,
      provider: c.providerOrg.name,
    },
    dossier: dossier
      ? {
          snapshotId: dossier.snapshotId,
          bundleHash: dossier.bundleHash,
          filedAt: dossier.filedAt,
          manifest: safeParse(dossier.manifest),
          artifacts: {
            pdf: `/api/dossiers/${dossier.id}/pdf`,
            json: `/api/dossiers/${dossier.id}/json`,
          },
        }
      : null,
    integrityCheck: { allMatched, evidence: evidenceIntegrity },
    dossierData,
    verificationInstructions:
      "Recompute keccak256 of each evidence file and compare to contentHash; recompute bundleHash = keccak256(keccak256('SULHA_DOSSIER_V1') || pdfDigest || jsonDigest).",
  });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}
