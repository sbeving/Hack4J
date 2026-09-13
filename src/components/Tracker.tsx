import { clsx } from "clsx";
import { Icon } from "@/components/Icon";
import {
  TRACKER_STAGES,
  STATE_TO_STAGE,
  type CaseState,
  type Locale,
} from "@/lib/domain/constants";

// Ledger-style progress: checked/teal for done, ringed for current, sand for pending.
export function Tracker({ state, locale }: { state: CaseState; locale: Locale }) {
  const active = STATE_TO_STAGE[state];
  const failed = state === "closed_unsettled" || state === "withdrawn";

  return (
    <ol className="flex items-start">
      {TRACKER_STAGES.map((stage, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={stage.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={clsx(
                  "h-0.5 flex-1 rounded-full",
                  i === 0 ? "opacity-0" : done || current ? "bg-primary" : "bg-border"
                )}
              />
              <span
                className={clsx(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-colors",
                  done && "border-primary bg-primary text-white",
                  current && !failed && "border-primary bg-primary text-white ring-4 ring-primary-tint",
                  current && failed && "border-danger bg-danger text-white ring-4 ring-danger-tint",
                  !done && !current && "border-border-strong bg-surface text-ink-muted"
                )}
              >
                {done ? <Icon name="check" size={15} /> : i + 1}
              </span>
              <span
                className={clsx(
                  "h-0.5 flex-1 rounded-full",
                  i === TRACKER_STAGES.length - 1 ? "opacity-0" : done ? "bg-primary" : "bg-border"
                )}
              />
            </div>
            <span
              className={clsx(
                "mt-2 px-1 text-center text-[11px] leading-tight",
                current ? "font-semibold text-ink" : "text-ink-muted"
              )}
            >
              {stage.label[locale]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
