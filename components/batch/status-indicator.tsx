import { cn } from "@/lib/utils";
import type { BatchHealth } from "@/lib/schema";

const STATUS_CONFIG: Record<
  BatchHealth,
  { label: string; colorVar: string; textClass: string }
> = {
  on_track: {
    label: "On track",
    colorVar: "var(--status-on-track)",
    textClass: "text-status-on-track",
  },
  watch: {
    label: "Watch",
    colorVar: "var(--status-watch)",
    textClass: "text-status-watch",
  },
  needs_action: {
    label: "Needs action",
    colorVar: "var(--status-needs-action)",
    textClass: "text-status-needs-action-text",
  },
};

/**
 * Status shapes are never color-only: each pairs a distinct shape
 * (circle / diamond / triangle) with a text label for sunlight + a11y.
 */
function StatusShape({ health }: { health: BatchHealth }) {
  const color = STATUS_CONFIG[health].colorVar;

  if (health === "on_track") {
    return (
      <span
        aria-hidden
        className="inline-block size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    );
  }

  if (health === "watch") {
    return (
      <span
        aria-hidden
        className="inline-block size-2.5 rotate-45"
        style={{ backgroundColor: color }}
      />
    );
  }

  // needs_action — upward triangle drawn with borders.
  return (
    <span
      aria-hidden
      className="inline-block size-0"
      style={{
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderBottom: `11px solid ${color}`,
      }}
    />
  );
}

export function StatusIndicator({
  health,
  className,
  showLabel = true,
}: {
  health: BatchHealth;
  className?: string;
  showLabel?: boolean;
}) {
  const config = STATUS_CONFIG[health];

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      role="status"
    >
      <StatusShape health={health} />
      {showLabel ? (
        <span className={cn("text-xs font-semibold", config.textClass)}>
          {config.label}
        </span>
      ) : (
        <span className="sr-only">{config.label}</span>
      )}
    </span>
  );
}
