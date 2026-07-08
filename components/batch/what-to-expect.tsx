import type { StageLike } from "@/lib/stages";

/**
 * Brings the stage guidance that lives in Learn onto the batch you're actually
 * staring at: what this stage should look/smell like today, framed against when
 * you last checked in. Changes as the batch matures (driven by `currentStage`).
 */
export function WhatToExpect({
  stage,
  currentDay,
  lastLoggedDay,
}: {
  stage: StageLike | null;
  /** Whole days since the batch started. */
  currentDay: number;
  /** Day-in-process of the most recent observation, or null if none yet. */
  lastLoggedDay: number | null;
}) {
  if (!stage) {
    return null;
  }

  // "Expectation vs. what you logged": nudge when this stage has no check-in yet.
  const loggedInStage =
    lastLoggedDay != null &&
    lastLoggedDay >= stage.dayStart &&
    (stage.dayEnd == null || lastLoggedDay <= stage.dayEnd);

  let logNote: string;
  if (lastLoggedDay == null) {
    logNote = "No check-in logged yet — add today's to start the record.";
  } else if (loggedInStage) {
    logNote =
      lastLoggedDay === currentDay
        ? "You logged a check-in today."
        : `Last check-in: Day ${lastLoggedDay}.`;
  } else {
    logNote = `Last check-in was Day ${lastLoggedDay} — worth a fresh look this stage.`;
  }

  return (
    <section className="rounded-[var(--radius-card)] border-l-4 border-accent bg-subtle-fill px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.4px] text-accent">
        What to expect today
      </p>
      <p className="mt-0.5 text-xs font-semibold text-secondary">
        {stage.name}
        {stage.actionLabel ? ` · ${stage.actionLabel}` : ""}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-ink">
        {stage.expectationText}
      </p>
      <p className="mt-2 border-t border-hairline pt-2 text-xs text-secondary">
        {logNote}
      </p>
    </section>
  );
}
