import "server-only";
import { prisma } from "@/lib/db";

/**
 * Authenticate an institutional integration request via `Authorization: Bearer`.
 * For the hackathon a single static token maps to the seeded institution;
 * production would use per-institution hashed IntegrationCredentials.
 */
export async function authenticateInstitution(req: Request): Promise<{ orgId: string } | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const expected = process.env.INSTITUTION_API_TOKEN;
  if (!expected || match[1].trim() !== expected) return null;
  const inst = await prisma.organization.findFirst({ where: { kind: "institution" } });
  return inst ? { orgId: inst.id } : null;
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" },
  });
}
