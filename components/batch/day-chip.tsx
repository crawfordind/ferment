import { cn } from "@/lib/utils";

export function DayChip({
  day,
  className,
}: {
  day: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[var(--radius-chip)] border border-border px-2.5 py-1 text-xs font-semibold text-secondary",
        className,
      )}
    >
      Day {day}
    </span>
  );
}
