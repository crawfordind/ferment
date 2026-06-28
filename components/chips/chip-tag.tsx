import { getChip } from "@/lib/chips";
import { cn } from "@/lib/utils";

/** Small read-only tag for a selected chip, used in the timeline. */
export function ChipTag({ chipKey }: { chipKey: string }) {
  const chip = getChip(chipKey);
  if (!chip) return null;

  const caution = chip.severity === "warning";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-chip)] px-2 py-0.5 text-xs font-medium",
        caution
          ? "bg-caution-selected-fill text-caution-selected-text"
          : "bg-subtle-fill text-secondary",
      )}
    >
      {chip.label}
    </span>
  );
}
