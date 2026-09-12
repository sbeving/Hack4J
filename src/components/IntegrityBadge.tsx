import { Badge } from "@/components/ui";
import type { IntegrityStatus } from "@/lib/integrity";

export function IntegrityBadge({
  status,
  isAr,
}: {
  status: IntegrityStatus | undefined;
  isAr: boolean;
}) {
  if (status === "mismatch") {
    return <Badge tone="danger">⚠ {isAr ? "تم التلاعب بالملف" : "altéré"}</Badge>;
  }
  if (status === "unavailable") {
    return <Badge tone="neutral">{isAr ? "تعذّر التحقّق" : "non vérifiable"}</Badge>;
  }
  return <Badge tone="success">✓ {isAr ? "بصمة مطابقة" : "hash intègre"}</Badge>;
}
