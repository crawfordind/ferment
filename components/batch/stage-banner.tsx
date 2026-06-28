import type { StageLike } from "@/lib/stages";

export function StageBanner({ stage }: { stage: StageLike | null }) {
  if (!stage) {
    return null;
  }

  return (
    <div className="rounded-[var(--radius-card)] border-l-4 border-accent bg-subtle-fill px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-accent">
        {stage.name}
        {stage.actionLabel ? ` · ${stage.actionLabel}` : ""}
      </p>
      <p className="mt-1 text-sm leading-snug text-ink">
        {stage.expectationText}
      </p>
    </div>
  );
}
