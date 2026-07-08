import { cn } from "@/lib/utils";
import type { BatchPhase } from "@/lib/progress";

// A slim, calm progress rail. Colour tracks the phase so "nearly there" and
// "overdue" read at a glance, but the accompanying text label (on the card) is
// what actually carries the meaning — the bar is reinforcement, never the only
// signal.
const PHASE_FILL: Record<BatchPhase, string> = {
  open: "var(--muted)",
  early: "var(--accent)",
  mid: "var(--accent)",
  nearly: "var(--status-watch)",
  ready: "var(--status-on-track)",
  overdue: "var(--status-needs-action)",
};

export function ProgressBar({
  percent,
  phase,
  className,
}: {
  /** 0..1, or null for open-ended batches (renders a faint indeterminate rail). */
  percent: number | null;
  phase: BatchPhase;
  className?: string;
}) {
  const pct = percent == null ? 0 : Math.round(percent * 100);

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-subtle-fill",
        className,
      )}
      role="progressbar"
      aria-valuenow={percent == null ? undefined : pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: percent == null ? "100%" : `${pct}%`,
          backgroundColor: PHASE_FILL[phase],
          opacity: percent == null ? 0.25 : 1,
        }}
      />
    </div>
  );
}
