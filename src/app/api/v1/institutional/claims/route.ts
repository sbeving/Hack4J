import { authenticateInstitution, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

const INSTITUTIONAL_STATES = [
  "dossier_filed",
  "in_mediation",
  "settlement_pending",
  "settled",
  "closed_unsettled",
];

// GET /api/v1/institutional/claims — institution-scoped assigned queue (bearer).
export async function GET(req: Request) {
  const auth = await authenticateInstitution(req);
  if (!auth) return unauthorized();

  const cases = await prisma.case.findMany({
    where: { institutionOrgId: auth.orgId, state: { in: INSTITUTIONAL_STATES } },
    orderBy: { updatedAt: "desc" },
    include: {
      claimantUser: { include: { org: true } },
      providerOrg: true,
      dossiers: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return Response.json({
    count: cases.length,
    claims: cases.map((c) => ({
      caseId: c.id,
      caseNumber: c.caseNumber,
      state: c.state,
      claimType: c.claimType,
      amountMillimes: c.amountMillimes,
      currency: c.currency,
      claimantOrg: c.claimantUser.org?.name ?? null,
      provider: c.providerOrg.name,
      escalationReason: c.escalationReason,
      dossier: c.dossiers[0]
        ? {
            snapshotId: c.dossiers[0].snapshotId,
            bundleHash: c.dossiers[0].bundleHash,
            filedAt: c.dossiers[0].filedAt,
            detail: `/api/v1/institutional/claims/${c.id}`,
          }
        : null,
    })),
  });
}
