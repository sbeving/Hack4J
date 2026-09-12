import { Card, Badge } from "@/components/ui";
import type { Locale } from "@/lib/domain/constants";

type DossierLite = {
  id: string;
  version: number;
  bundleHash: string | null;
  snapshotId: string;
  filedAt: Date | null;
  manifest: string;
};

export function DossierPanel({ dossier, locale }: { dossier: DossierLite; locale: Locale }) {
  const isAr = locale === "ar";
  let manifest: { integrity?: string }[] = [];
  try {
    manifest = JSON.parse(dossier.manifest || "[]");
  } catch {
    /* ignore */
  }
  const total = manifest.length;
  const mismatches = manifest.filter((m) => m.integrity === "mismatch").length;

  return (
    <Card className="border-violet-200 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
          {isAr ? "الملفّ الموحّد" : "Dossier standardisé"}
        </h3>
        <Badge tone="success">{isAr ? "تم الإرسال" : "transmis"}</Badge>
      </div>

      <div className="mt-2 grid gap-1 text-xs text-muted">
        <div>snapshot <span className="font-mono">{dossier.snapshotId.slice(0, 8)}…</span> · v{dossier.version}</div>
        {dossier.bundleHash ? (
          <div>
            bundle keccak256{" "}
            <span className="font-mono">{dossier.bundleHash.slice(0, 14)}…{dossier.bundleHash.slice(-6)}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="font-semibold">
          {total} {isAr ? "قطعة" : "pièce(s)"}
        </span>
        {mismatches > 0 ? (
          <Badge tone="danger">
            ⚠ {mismatches} {isAr ? "متلاعب بها" : "altérée(s)"}
          </Badge>
        ) : (
          <Badge tone="success">✓ {isAr ? "المانيفست سليم" : "manifeste intègre"}</Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/api/dossiers/${dossier.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          📄 {isAr ? "الملفّ (PDF)" : "Dossier (PDF)"}
        </a>
        <a
          href={`/api/dossiers/${dossier.id}/json`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          {"{ }"} JSON
        </a>
      </div>
    </Card>
  );
}
