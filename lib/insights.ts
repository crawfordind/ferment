import { computeDayInProcess } from "@/lib/day";

// Pure, dependency-light dashboard analytics. Everything here is derived from
// batches + observations the app already holds locally, so the Insights widget
// works offline and stays unit-testable (no Dexie, no clock beyond `now`).

const MS_PER_DAY = 86_400_000;
export const WEEK_DAYS = 7;

export type InsightBatch = {
  id: string;
  name: string;
  code: string;
  status: string;
  startedAt: number;
};

export type InsightObservation = { observedAt: number };

type Stage = {
  stageIndex: number;
  name: string;
  dayStart: number;
  dayEnd: number | null;
  actionLabel: string | null;
};

export type InsightTemplate = { stages: Stage[] };

export type UpcomingTransition = {
  batchId: string;
  batchName: string;
  batchCode: string;
  stageName: string;
  /** Whole days from now until the batch reaches this stage (>= 1). */
  inDays: number;
  atMs: number;
};

export type HarvestReminder = {
  batchId: string;
  batchName: string;
  batchCode: string;
  actionLabel: string;
  overdue: boolean;
};

export type Insights = {
  /** Total observations logged in the trailing 7-day window. */
  loggedThisWeek: number;
  /** Did any log land on each of the last 7 calendar days? Oldest → today. */
  activeDays: boolean[];
  /** Consecutive calendar days with at least one log, ending today. */
  currentStreak: number;
  upcomingTransitions: UpcomingTransition[];
  harvestReminders: HarvestReminder[];
};

/** Local-midnight timestamp for the day containing `ms`. */
function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export type ComputeInsightsArgs = {
  batches: InsightBatch[];
  observations: InsightObservation[];
  /** Resolve a batch's stage template (e.g. from the seed data). */
  templateFor: (batch: InsightBatch) => InsightTemplate | null;
  now?: number;
  /** How many soonest transitions / reminders to surface. */
  limit?: number;
};

export function computeInsights({
  batches,
  observations,
  templateFor,
  now = Date.now(),
  limit = 4,
}: ComputeInsightsArgs): Insights {
  const active = batches.filter((b) => b.status === "active");

  // --- Logging streak over the trailing week -----------------------------
  const today = startOfLocalDay(now);
  const windowStart = today - (WEEK_DAYS - 1) * MS_PER_DAY;
  const activeDays = Array.from({ length: WEEK_DAYS }, () => false);
  let loggedThisWeek = 0;
  for (const obs of observations) {
    if (obs.observedAt < windowStart) continue;
    const dayIndex = Math.floor((startOfLocalDay(obs.observedAt) - windowStart) / MS_PER_DAY);
    if (dayIndex >= 0 && dayIndex < WEEK_DAYS) {
      activeDays[dayIndex] = true;
      loggedThisWeek += 1;
    }
  }
  let currentStreak = 0;
  for (let i = WEEK_DAYS - 1; i >= 0 && activeDays[i]; i--) {
    currentStreak += 1;
  }

  // --- Upcoming stage transitions & harvest reminders --------------------
  const upcomingTransitions: UpcomingTransition[] = [];
  const harvestReminders: HarvestReminder[] = [];

  for (const batch of active) {
    const template = templateFor(batch);
    if (!template || template.stages.length === 0) continue;

    const day = computeDayInProcess(batch.startedAt, now);
    const stages = [...template.stages].sort((a, b) => a.stageIndex - b.stageIndex);

    // Next stage the batch hasn't reached yet.
    const next = stages.find((s) => s.dayStart > day);
    if (next) {
      upcomingTransitions.push({
        batchId: batch.id,
        batchName: batch.name,
        batchCode: batch.code,
        stageName: next.name,
        inDays: next.dayStart - day,
        atMs: batch.startedAt + next.dayStart * MS_PER_DAY,
      });
      continue;
    }

    // No future stage: if the terminal stage is a scheduled collection step
    // (multi-stage template with an action, e.g. "Strain"), it's harvest-ready.
    const last = stages[stages.length - 1];
    if (stages.length >= 2 && last.actionLabel && day >= last.dayStart) {
      harvestReminders.push({
        batchId: batch.id,
        batchName: batch.name,
        batchCode: batch.code,
        actionLabel: last.actionLabel,
        overdue: last.dayEnd !== null && day > last.dayEnd,
      });
    }
  }

  upcomingTransitions.sort((a, b) => a.inDays - b.inDays || a.atMs - b.atMs);
  // Overdue harvests first, then by name for stability.
  harvestReminders.sort(
    (a, b) => Number(b.overdue) - Number(a.overdue) || a.batchName.localeCompare(b.batchName),
  );

  return {
    loggedThisWeek,
    activeDays,
    currentStreak,
    upcomingTransitions: upcomingTransitions.slice(0, limit),
    harvestReminders: harvestReminders.slice(0, limit),
  };
}
