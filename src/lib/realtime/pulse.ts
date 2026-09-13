import "server-only";
import { prisma } from "@/lib/db";
import { AI_RESPONSE_KINDS, type Role } from "@/lib/domain/constants";
import type { SessionUser } from "@/lib/session";

// A "pulse" is a cheap change signature for a screen. Every meaningful action
// bumps the case version/state or appends a CaseEvent, so comparing signatures
// tells us something happened without rendering anything.

/** Signature for one case, or null when the session may not see it. */
export async function casePulse(caseId: string, s: SessionUser): Promise<string | null> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      state: true,
      version: true,
      updatedAt: true,
      claimantUserId: true,
      providerOrgId: true,
      institutionOrgId: true,
      _count: { select: { events: true, evidence: true, notices: true, mediations: true } },
    },
  });
  if (!c) return null;

  const allowed =
    s.role === "admin" ||
    (s.role === "claimant" && c.claimantUserId === s.id) ||
    (s.role === "provider_agent" && c.providerOrgId === s.orgId) ||
    (s.role === "resolver" && c.institutionOrgId === s.orgId);
  if (!allowed) return null;

  // Cached AI payloads live in ProviderResponse too — counting them would make
  // the AI's own cache write look like a new exchange.
  const exchanges = await prisma.providerResponse.count({
    where: { caseId, kind: { notIn: AI_RESPONSE_KINDS } },
  });

  const n = c._count;
  return [
    c.version,
    c.state,
    n.events,
    exchanges,
    n.evidence,
    n.notices,
    n.mediations,
    c.updatedAt.getTime(),
  ].join(":");
}

const SCOPE: Record<Role, (s: SessionUser) => object | null> = {
  claimant: (s) => ({ claimantUserId: s.id }),
  provider_agent: (s) => (s.orgId ? { providerOrgId: s.orgId } : null),
  resolver: (s) => (s.orgId ? { institutionOrgId: s.orgId } : null),
  admin: () => ({}),
};

/** Signature for a list screen (queue / "my claims") + the notification bell. */
export async function scopePulse(s: SessionUser): Promise<string | null> {
  const where = SCOPE[s.role](s);
  if (!where) return null;
  const agg = await prisma.case.aggregate({
    where,
    _count: { _all: true },
    _sum: { version: true },
    _max: { updatedAt: true },
  });
  const unread = await prisma.notification.count({ where: { userId: s.id, readAt: null } });
  return [agg._count._all, agg._sum.version ?? 0, agg._max.updatedAt?.getTime() ?? 0, unread].join(":");
}

/** The signature for whatever screen the client asked about. */
export function readPulse(caseId: string | null, s: SessionUser): Promise<string | null> {
  return caseId ? casePulse(caseId, s) : scopePulse(s);
}
