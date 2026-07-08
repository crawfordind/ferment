import type { ChipSeverity } from "@/lib/chips";
import { cn } from "@/lib/utils";

export function SensoryChip({
  label,
  severity,
  selected,
  onToggle,
}: {
  label: string;
  severity: ChipSeverity;
  selected: boolean;
  onToggle: () => void;
}) {
  const caution = severity === "warning";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "min-h-tap-min rounded-[var(--radius-chip)] border-2 px-3.5 py-2 text-sm font-medium transition-colors",
        // Neutral chip
        !caution &&
          !selected &&
          "border-border bg-card text-ink hover:bg-subtle-fill",
        !caution && selected && "border-accent bg-subtle-fill text-ink",
        // Caution chip (amber)
        caution &&
          !selected &&
          "border-caution-outline bg-card text-caution-text hover:bg-subtle-fill",
        caution &&
          selected &&
          "border-caution-selected-border bg-caution-selected-fill text-caution-selected-text",
      )}
    >
      {label}
    </button>
  );
}
