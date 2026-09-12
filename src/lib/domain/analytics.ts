import "server-only";
import { prisma } from "@/lib/db";

const TERMINAL = ["resolved", "settled", "closed_unsettled"];

// Transparent, mentor-replaceable assumptions (NOT official statistics).
export const AGENCY_ASSUMPTIONS = {
  minutesPerCase: 65, // intake + completeness check saved by structured, verified filing
  foldersPerCase: 1.5, // physical folders / copies avoided
  exchangesRemovedPerCase: 2, // missing-evidence back-and-forths removed
};

export type Analytics = Awaited<ReturnType<typeof getNetworkAnalytics>>;

export async function getNetworkAnalytics(scope?: {
  providerOrgId?: string;
  institutionOrgId?: string;
}) {
  const where: Record<string, unknown> = { state: { not: "draft" } };
  if (scope?.providerOrgId) where.providerOrgId = scope.providerOrgId;
  if (scope?.institutionOrgId) where.institutionOrgId = scope.institutionOrgId;

  const cases = await prisma.case.findMany({
    where,
    select: {
      state: true,
      claimType: true,
      providerOrgId: true,
      amountMillimes: true,
      createdAt: true,
      updatedAt: true,
      slaDueAt: true,
      escalationReason: true,
      institutionOrgId: true,
    },
  });
  const providers = await prisma.organization.findMany({ where: { kind: "provider" }, select: { id: true, name: true } });
  const providerName = new Map(providers.map((p) => [p.id, p.name]));

  const byType: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  const byState: Record<string, number> = {};
  let terminalCount = 0,
    resolvedCount = 0,
    settledCount = 0,
    closedCount = 0,
    escalatedCount = 0,
    amountSum = 0,
    resolutionMsSum = 0,
    resolutionN = 0,
    slaEligible = 0,
    slaMet = 0;

  for (const c of cases) {
    byType[c.claimType] = (byType[c.claimType] ?? 0) + 1;
    byProvider[c.providerOrgId] = (byProvider[c.providerOrgId] ?? 0) + 1;
    byState[c.state] = (byState[c.state] ?? 0) + 1;
    amountSum += c.amountMillimes;
    if (c.institutionOrgId || c.escalationReason) escalatedCount++;
    if (TERMINAL.includes(c.state)) {
      terminalCount++;
      if (c.state === "resolved") resolvedCount++;
      else if (c.state === "settled") settledCount++;
      else closedCount++;
      const ms = c.updatedAt.getTime() - c.createdAt.getTime();
      if (ms > 0) {
        resolutionMsSum += ms;
        resolutionN++;
      }
      if (c.slaDueAt) {
        slaEligible++;
        if (c.updatedAt.getTime() <= c.slaDueAt.getTime()) slaMet++;
      }
    }
  }

  const total = cases.length;
  const agency = {
    ...AGENCY_ASSUMPTIONS,
    cases: total,
    minutesSaved: total * AGENCY_ASSUMPTIONS.minutesPerCase,
    hoursSaved: Math.round((total * AGENCY_ASSUMPTIONS.minutesPerCase) / 60),
    foldersSaved: Math.round(total * AGENCY_ASSUMPTIONS.foldersPerCase),
    exchangesRemoved: total * AGENCY_ASSUMPTIONS.exchangesRemovedPerCase,
  };

  return {
    total,
    open: total - terminalCount,
    terminalCount,
    resolvedCount,
    settledCount,
    closedCount,
    escalatedCount,
    amountMillimes: amountSum,
    avgResolutionDays: resolutionN ? resolutionMsSum / resolutionN / (24 * 3600 * 1000) : 0,
    preEscalationRate: terminalCount ? resolvedCount / terminalCount : 0,
    slaCompliance: slaEligible ? slaMet / slaEligible : 0,
    byType: Object.entries(byType).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    byProvider: Object.entries(byProvider)
      .map(([id, count]) => ({ name: providerName.get(id) ?? id, count }))
      .sort((a, b) => b.count - a.count),
    byState,
    agency,
  };
}
