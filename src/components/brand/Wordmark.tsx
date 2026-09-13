import { clsx } from "clsx";
import { Seal } from "@/components/brand/Seal";

export function Wordmark({
  size = 30,
  showText = true,
  tone = "brand",
  className,
}: {
  size?: number;
  showText?: boolean;
  tone?: "brand" | "mono";
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <Seal size={size} tone={tone} />
      {showText ? (
        <span className="font-display text-[1.3rem] font-extrabold leading-none tracking-tight">Moufehma</span>
      ) : null}
    </span>
  );
}
