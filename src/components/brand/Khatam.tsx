// The Khatam eight-point star — Moufehma's single geometric motif.
// Gold/red are lines and marks only, never fills of large areas.
export const KHATAM_PATH =
  "M50,2 L57.65,31.52 L83.94,16.06 L68.48,42.35 L98,50 L68.48,57.65 L83.94,83.94 L57.65,68.48 L50,98 L42.35,68.48 L16.06,83.94 L31.52,57.65 L2,50 L31.52,42.35 L16.06,16.06 L42.35,31.52 Z";

export function KhatamStar({
  size = 24,
  className,
  stroke = "var(--gold)",
  strokeWidth = 2,
}: {
  size?: number;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <path d={KHATAM_PATH} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

/** A faint tiled khatam field — the "felt, not seen" letterhead watermark.
 *  Absolutely positioned by the caller; pass a unique id when multiple appear. */
export function KhatamField({
  id = "khatam",
  className,
  color = "var(--gold)",
  opacity = 0.05,
  tile = 76,
  scale = 0.6,
}: {
  id?: string;
  className?: string;
  color?: string;
  opacity?: number;
  tile?: number;
  scale?: number;
}) {
  const inset = (tile - 100 * scale) / 2;
  return (
    <svg className={className} width="100%" height="100%" aria-hidden="true" style={{ opacity }}>
      <defs>
        <pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g transform={`translate(${inset} ${inset}) scale(${scale})`}>
            <path d={KHATAM_PATH} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
