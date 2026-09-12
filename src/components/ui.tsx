import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Icon, type IconName } from "@/components/Icon";

export const cn = clsx;

// ── Surfaces ─────────────────────────────────────────────────────────────────
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

// ── Headings ─────────────────────────────────────────────────────────────────
export function PageTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {icon ? (
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-tint text-primary-deep">
            <Icon name={icon} size={20} />
          </span>
        ) : null}
        <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-ink">{title}</h1>
      </div>
      {subtitle ? <p className="mt-1.5 text-[15px] text-ink-muted">{subtitle}</p> : null}
    </div>
  );
}

/** Section head — normal-case, no ALL-CAPS eyebrow. */
export function SectionHead({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h3 className="text-[15px] font-semibold text-ink">{children}</h3>
      {action}
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────
type Variant = "primary" | "outline" | "ghost" | "danger" | "cobalt";
const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-surface hover:bg-primary-deep",
  outline: "border border-border-strong bg-surface text-ink hover:bg-primary-tint hover:border-primary",
  ghost: "text-ink-muted hover:bg-surface-sand hover:text-ink",
  danger: "bg-danger text-surface hover:bg-seal-deep",
  cobalt: "bg-cobalt text-surface hover:brightness-95",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; icon?: IconName }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-sm",
        VARIANT[variant],
        className
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 15 : 17} /> : null}
      {children}
    </button>
  );
}

// ── Badges + status dots ─────────────────────────────────────────────────────
export type Tone = "neutral" | "brand" | "cobalt" | "success" | "warning" | "danger" | "seal" | "info";
const TONE_BADGE: Record<Tone, string> = {
  neutral: "bg-surface-sand text-ink-muted",
  brand: "bg-primary-tint text-primary-deep",
  cobalt: "bg-cobalt-tint text-cobalt",
  info: "bg-cobalt-tint text-cobalt",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-[#9a4e1e]",
  danger: "bg-danger-tint text-danger",
  seal: "bg-danger-tint text-seal",
};
const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-ink-muted",
  brand: "bg-primary",
  cobalt: "bg-cobalt",
  info: "bg-cobalt",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  seal: "bg-seal",
};

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
        TONE_BADGE[tone],
        className
      )}
    >
      {dot ? <span className={cn("dot", TONE_DOT[tone])} /> : null}
      {children}
    </span>
  );
}

/** A bare status: dot + word, no fill — the ledger status pattern. */
export function StatusDot({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
      <span className={cn("dot", TONE_DOT[tone])} />
      {children}
    </span>
  );
}

export function DemoBadge({ label = "Démo" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-tint px-2 py-0.5 text-[11px] font-semibold text-[#9a4e1e]">
      <span className="dot bg-warning" />
      {label}
    </span>
  );
}

// ── Stat tile (KPI — flat, no shadow) ────────────────────────────────────────
export function StatTile({
  value,
  label,
  tone = "neutral",
  icon,
}: {
  value: string;
  label: string;
  tone?: Tone;
  icon?: IconName;
}) {
  const valueColor =
    tone === "success" ? "text-success" : tone === "brand" ? "text-primary-deep" : tone === "cobalt" ? "text-cobalt" : tone === "warning" ? "text-warning" : "text-ink";
  return (
    <div className="card-flat p-4">
      {icon ? (
        <span className="mb-2 inline-grid h-8 w-8 place-items-center rounded-lg bg-primary-tint text-primary-deep">
          <Icon name={icon} size={17} />
        </span>
      ) : null}
      <div className={cn("font-display text-[1.75rem] font-bold leading-none", valueColor)}>{value}</div>
      <div className="mt-1.5 text-xs text-ink-muted">{label}</div>
    </div>
  );
}

// ── Form primitives ──────────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}

const CONTROL =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, "resize-y", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(CONTROL, "appearance-none bg-[right_0.75rem_center] pe-9", props.className)} />;
}
