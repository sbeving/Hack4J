import { Icon, type IconName } from "@/components/Icon";
import { Seal } from "@/components/brand/Seal";
import { Wordmark } from "@/components/brand/Wordmark";
import { KhatamStar, KhatamField } from "@/components/brand/Khatam";

const NAMES: IconName[] = [
  "seal", "workshop", "tower", "scales", "network", "document", "stamp", "dossier",
  "handshake", "conciliation", "anchor", "shield", "bell", "upload", "download", "mic",
  "clock", "check", "close", "plus", "arrow", "chevron", "globe", "logout", "braces",
  "search", "filter", "alert", "sparkle", "send", "eye", "spinner",
];

export default function IconPreview() {
  return (
    <div style={{ padding: 40 }} className="bg-paper text-ink">
      <div className="mb-10 flex flex-wrap items-center gap-10">
        <Wordmark size={44} />
        <Seal size={64} />
        <div className="rounded-2xl bg-primary-deep p-4 text-surface">
          <Seal size={44} tone="mono" />
        </div>
        <KhatamStar size={56} stroke="var(--gold)" />
        <KhatamStar size={56} stroke="var(--primary)" />
      </div>
      <div className="relative mb-10 h-28 overflow-hidden rounded-xl border border-border bg-surface">
        <KhatamField id="prev" className="absolute inset-0" opacity={0.08} />
        <div className="relative p-4 font-display text-2xl font-bold">Khatam letterhead field (watermark)</div>
      </div>
      <div className="grid grid-cols-8 gap-5">
        {NAMES.map((n) => (
          <div key={n} className="text-center">
            <div className="grid h-11 place-items-center text-ink">
              <Icon name={n} size={26} />
            </div>
            <div className="text-[11px] text-ink-muted">{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
