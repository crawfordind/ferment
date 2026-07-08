import { computeDayInProcess } from "@/lib/day";
import type { StageLike } from "@/lib/stages";

// A batch's sense of progress: where it is in its expected run and when it's
// likely ready. Pure and clock-injectable so it stays unit-testable and works
// the same on the card, the detail header, and offline.

const MS_PER_DAY = 86_400_000;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type BatchPhase =
  /** No template / no known length — we can only count days. */
  | "open"
  /** Day 0–1, just getting going. */
  | "early"
  /** In the thick of the ferment. */
  | "mid"
  /** ≥80% of the way through. */
  | "nearly"
  /** Reached its expected ready day. */
  | "ready"
  /** Past its expected ready day. */
  | "overdue";

export type BatchProgress = {
  /** Whole days elapsed since start (>= 0). */
  day: number;
  /** Expected run length in days, or null when open-ended / template-less. */
  totalDays: number | null;
  /** 0..1 completion, or null when totalDays is unknown. */
  percent: number | null;
  /** Estimated ready timestamp, or null when totalDays is unknown. */
  readyAt: number | null;
  phase: BatchPhase;
};

/**
 * The expected run length of a template: the final stage's end day (falling back
 * to its start day). Returns null for open-ended templates (final `dayEnd` null)
 * so callers can show "Day N" without a misleading total.
 */
export function templateLengthDays(
  template: { stages: StageLike[] } | null | undefined,
): number | null {
  if (!template || template.stages.length === 0) return null;
  const last = [...template.stages]
    .sort((a, b) => a.stageIndex - b.stageIndex)
    .at(-1)!;
  return last.dayEnd ?? null;
}

export function computeBatchProgress(
  batch: { startedAt: number },
  template: { stages: StageLike[] } | null | undefined,
  now: number = Date.now(),
): BatchProgress {
  const day = computeDayInProcess(batch.startedAt, now);
  const totalDays = templateLengthDays(template);

  if (totalDays == null || totalDays <= 0) {
    return {
      day,
      totalDays: null,
      percent: null,
      readyAt: null,
      phase: "open",
    };
  }

  const ratio = day / totalDays;
  const percent = Math.min(1, Math.max(0, ratio));
  const readyAt = batch.startedAt + totalDays * MS_PER_DAY;

  let phase: BatchPhase;
  if (day > totalDays) phase = "overdue";
  else if (day === totalDays) phase = "ready";
  else if (ratio >= 0.8) phase = "nearly";
  else if (day <= 1) phase = "early";
  else phase = "mid";

  return { day, totalDays, percent, readyAt, phase };
}

/** Deterministic short date ("Jul 14") from a timestamp's local calendar day. */
export function formatReadyDate(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/**
 * A single compact progress label for a card or header, e.g.
 * "Day 8 of ~14 · ready Jul 13", "Day 3 · ready Jul 14" (overdue framing),
 * or just "Day 2" for open-ended batches.
 */
export function formatProgressLabel(progress: BatchProgress): string {
  const { day, totalDays, readyAt, phase } = progress;
  if (totalDays == null) return `Day ${day}`;

  const dayPart =
    phase === "overdue" ? `Day ${day}` : `Day ${day} of ~${totalDays}`;
  if (readyAt == null) return dayPart;

  const readyPart =
    phase === "overdue"
      ? `ready by ${formatReadyDate(readyAt)}`
      : `ready ${formatReadyDate(readyAt)}`;
  return `${dayPart} · ${readyPart}`;
}
