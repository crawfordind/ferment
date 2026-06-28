import { computeDayInProcess } from "@/lib/day";

export type StageLike = {
  stageIndex: number;
  name: string;
  dayStart: number;
  dayEnd: number | null;
  expectationText: string;
  actionLabel: string | null;
};

/** Whole days elapsed since the batch started (>= 0). */
export function dayInProcess(
  batch: { startedAt: number },
  now: number = Date.now(),
): number {
  return computeDayInProcess(batch.startedAt, now);
}

/**
 * The stage the batch is currently in, by day. Picks the latest stage whose
 * `dayStart` has been reached; beyond the final stage it stays on the last one
 * (handles open-ended final stages like JLF where `dayEnd` is null).
 */
export function currentStage<T extends StageLike>(
  batch: { startedAt: number },
  template: { stages: T[] },
  now: number = Date.now(),
): T | null {
  if (template.stages.length === 0) {
    return null;
  }

  const day = dayInProcess(batch, now);
  const ordered = [...template.stages].sort(
    (a, b) => a.stageIndex - b.stageIndex,
  );

  let current = ordered[0];
  for (const stage of ordered) {
    if (day >= stage.dayStart) {
      current = stage;
    }
  }
  return current;
}

/**
 * True when the current stage has a one-time action whose window has passed
 * (we're past a finite `dayEnd`). Open-ended stages are never "overdue".
 */
export function isStageActionOverdue(
  batch: { startedAt: number },
  template: { stages: StageLike[] },
  now: number = Date.now(),
): boolean {
  const stage = currentStage(batch, template, now);
  if (!stage || !stage.actionLabel || stage.dayEnd === null) {
    return false;
  }
  return dayInProcess(batch, now) > stage.dayEnd;
}
