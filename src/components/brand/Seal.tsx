import { clsx } from "clsx";
import { KHATAM_PATH } from "@/components/brand/Khatam";

/** The صلح cachet: the word (Reem Kufi) seated inside the khatam ring.
 *  tone: "brand" (gold ring + crimson word) or "mono" (single color, e.g. on teal). */
export function Seal({
  size = 34,
  tone = "brand",
  className,
}: {
  size?: number;
  tone?: "brand" | "mono";
  className?: string;
}) {
  const word = tone === "mono" ? "currentColor" : "var(--seal)";
  const ring = tone === "mono" ? "currentColor" : "var(--gold)";
  const inner = tone === "mono" ? "currentColor" : "var(--seal)";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={clsx("shrink-0", className)}
      role="img"
      aria-label="صلح Sulha"
    >
      <path d={KHATAM_PATH} fill="none" stroke={ring} strokeWidth={1.4} strokeLinejoin="round" opacity={0.95} />
      <circle cx="50" cy="50" r="30" fill="none" stroke={inner} strokeWidth={1.1} opacity={0.8} />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        direction="rtl"
        style={{ fontFamily: "var(--font-kufi)", fontWeight: 700, fontSize: "30px", fill: word }}
      >
        صلح
      </text>
    </svg>
  );
}
