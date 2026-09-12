import {
  TRACKER_STAGES,
  STATE_TO_STAGE,
  type CaseState,
  type Locale,
} from "@/lib/domain/constants";
import { clsx } from "clsx";

// Delivery-app style progress tracker.
export function Tracker({ state, locale }: { state: CaseState; locale: Locale }) {
  const active = STATE_TO_STAGE[state];
  const failed = state === "closed_unsettled" || state === "withdrawn";

  return (
    <ol className="flex items-stretch">
      {TRACKER_STAGES.map((stage, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={stage.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={clsx(
                  "h-0.5 flex-1",
                  i === 0 ? "opacity-0" : done || current ? "bg-brand" : "bg-slate-200"
                )}
              />
              <span
                className={clsx(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-white",
                  done && "bg-brand text-white",
                  current && !failed && "bg-brand text-white shadow-lg shadow-indigo-200",
                  current && failed && "bg-rose-500 text-white",
                  !done && !current && "bg-slate-200 text-slate-500"
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={clsx(
                  "h-0.5 flex-1",
                  i === TRACKER_STAGES.length - 1 ? "opacity-0" : done ? "bg-brand" : "bg-slate-200"
                )}
              />
            </div>
            <span
              className={clsx(
                "mt-2 px-1 text-center text-[11px] leading-tight",
                current ? "font-bold text-foreground" : "text-muted"
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
