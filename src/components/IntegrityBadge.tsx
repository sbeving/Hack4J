import { Badge } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type { IntegrityStatus } from "@/lib/integrity";

export function IntegrityBadge({
  status,
  isAr,
}: {
  status: IntegrityStatus | undefined;
  isAr: boolean;
}) {
  if (status === "mismatch") {
    return (
      <Badge tone="danger">
        <Icon name="alert" className="me-1 inline-block align-[-2px]" />
        {isAr ? "تم التلاعب بالملف" : "altéré"}
      </Badge>
    );
  }
  if (status === "unavailable") {
    return <Badge tone="neutral">{isAr ? "تعذّر التحقّق" : "non vérifiable"}</Badge>;
  }
  return (
    <Badge tone="success">
      <Icon name="check" className="me-1 inline-block align-[-2px]" />
      {isAr ? "بصمة مطابقة" : "hash intègre"}
    </Badge>
  );
}
