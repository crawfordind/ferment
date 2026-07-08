import { STAGE_META } from "@/lib/knowledge";
import type { NutritiveStage } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

// Nutritive-cycle stage → color. Vegetative=green(N), cross-over=amber(P),
// reproductive=orange(K), plus neutral tones for backbone/soil inputs.
const STAGE_STYLE: Record<NutritiveStage, string> = {
  vegetative: "bg-[color-mix(in_srgb,var(--status-on-track)_16%,var(--surface))] text-[var(--status-on-track)]",
  "cross-over": "bg-[color-mix(in_srgb,var(--status-watch)_20%,var(--surface))] text-[var(--caution-text)]",
  reproductive: "bg-[color-mix(in_srgb,var(--status-needs-action)_18%,var(--surface))] text-[var(--status-needs-action-text)]",
  "all-stages": "bg-subtle-fill text-secondary",
  soil: "bg-[color-mix(in_srgb,#8a6d3b_16%,var(--surface))] text-[#6b5228]",
};

export function StageBadge({ stage, className }: { stage: NutritiveStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-chip)] px-2 py-0.5 text-[11px] font-semibold",
        STAGE_STYLE[stage],
        className,
      )}
    >
      {STAGE_META[stage].short}
    </span>
  );
}
