import { getChip } from "@/lib/chips";
import { computeDayInProcess } from "@/lib/day";
import { currentStage, type StageLike } from "@/lib/stages";
import { healthFromChips, healthFromPh } from "@/lib/status";
import type { BatchHealth, FermentType } from "@/lib/schema";

const MS_PER_DAY = 86_400_000;

export type PulseObservation = {
  observedAt: number;
  ph?: number | null;
  brix?: number | null;
  tempC?: number | null;
  chipKeys: string[];
};

export type MeasurementDelta = {
  metric: "ph" | "brix" | "tempC";
  from: number;
  to: number;
  fromDay: number;
  toDay: number;
  delta: number;
};

export type BatchPulse = {
  /** e.g. "Logged today" / "Last check-in 2 days ago · Day 5" */
  checkInLine: string;
  /** Days since the most recent observation, or null if none. */
  daysSinceLog: number | null;
  /** First→latest delta for the most interesting metric with ≥2 readings. */
  measurement: MeasurementDelta | null;
  /** Factual next milestone from the stage schedule, if any. */
  nextLine: string | null;
  /** Why health isn't on_track, derived from chips/pH — never speculative prose. */
  healthLine: string | null;
  observationCount: number;
};

type Reading = { value: number; day: number; at: number };

function readingsFor(
  observations: PulseObservation[],
  startedAt: number,
  key: "ph" | "brix" | "tempC",
): Reading[] {
  const out: Reading[] = [];
  for (const o of observations) {
    const value = o[key];
    if (value == null || !Number.isFinite(value)) continue;
    out.push({
      value,
      day: computeDayInProcess(startedAt, o.observedAt),
      at: o.observedAt,
    });
  }
  return out.sort((a, b) => a.at - b.at);
}

/**
 * Prefer pH (most actionable for ferment health), then Brix, then temp.
 * Needs at least two readings of the same metric.
 */
export function primaryMeasurementDelta(
  observations: PulseObservation[],
  startedAt: number,
): MeasurementDelta | null {
  for (const metric of ["ph", "brix", "tempC"] as const) {
    const series = readingsFor(observations, startedAt, metric);
    if (series.length < 2) continue;
    const first = series[0];
    const last = series[series.length - 1];
    return {
      metric,
      from: first.value,
      to: last.value,
      fromDay: first.day,
      toDay: last.day,
      delta: last.value - first.value,
    };
  }
  return null;
}

function formatCheckInLine(
  lastObservedAt: number | null,
  startedAt: number,
  now: number,
): { line: string; daysSinceLog: number | null } {
  if (lastObservedAt == null) {
    return {
      line: "No check-ins yet — log one to start the record.",
      daysSinceLog: null,
    };
  }

  const lastDay = computeDayInProcess(startedAt, lastObservedAt);
  const daysSince = Math.max(
    0,
    Math.floor((now - lastObservedAt) / MS_PER_DAY),
  );

  if (daysSince === 0) {
    return { line: `Logged today · Day ${lastDay}`, daysSinceLog: 0 };
  }
  if (daysSince === 1) {
    return {
      line: `Last check-in yesterday · Day ${lastDay}`,
      daysSinceLog: 1,
    };
  }
  return {
    line: `Last check-in ${daysSince} days ago · Day ${lastDay}`,
    daysSinceLog: daysSince,
  };
}

/**
 * Next concrete milestone from the template schedule — day math only, no
 * sensory guessing.
 */
export function nextMilestoneLine(
  batch: { startedAt: number },
  template: { stages: StageLike[] } | null,
  now: number = Date.now(),
): string | null {
  if (!template || template.stages.length === 0) return null;

  const day = computeDayInProcess(batch.startedAt, now);
  const stages = [...template.stages].sort((a, b) => a.stageIndex - b.stageIndex);

  const next = stages.find((s) => s.dayStart > day);
  if (next) {
    const inDays = next.dayStart - day;
    const label = next.actionLabel ?? next.name;
    if (inDays === 1) return `${label} tomorrow`;
    return `${label} in ${inDays} days`;
  }

  const stage = currentStage(batch, template, now);
  if (!stage) return null;

  if (stage.actionLabel && stage.dayEnd !== null) {
    if (day > stage.dayEnd) return `${stage.actionLabel} overdue`;
    if (day === stage.dayEnd) return `${stage.actionLabel} today`;
    const remaining = stage.dayEnd - day;
    if (remaining === 1) return `${stage.actionLabel} tomorrow`;
    return `${stage.actionLabel} in ${remaining} days`;
  }

  if (stage.actionLabel) {
    return `${stage.name} · ${stage.actionLabel}`;
  }

  return stage.name;
}

function healthExplanation(
  batch: { startedAt: number; type?: FermentType; health: BatchHealth },
  latest: PulseObservation | null,
  now: number,
): string | null {
  if (batch.health === "on_track" || !latest) return null;

  const day = computeDayInProcess(batch.startedAt, now);
  const chipHealth = healthFromChips(latest.chipKeys);
  if (chipHealth !== "on_track") {
    const labels = latest.chipKeys
      .map((key) => getChip(key))
      .filter((chip) => chip?.severity === "warning")
      .map((chip) => chip!.label)
      .slice(0, 2);
    return labels.length > 0
      ? `Flagged from latest notes: ${labels.join(", ")}`
      : "Flagged from latest sensory notes";
  }

  const phHealth = healthFromPh(batch.type, latest.ph, day);
  if (phHealth !== "on_track" && latest.ph != null) {
    return `pH ${latest.ph} on Day ${day} is above the expected range for this ferment`;
  }

  if (batch.health === "needs_action") {
    return "A scheduled stage action is past due";
  }
  if (batch.health === "watch") {
    return "Marked watch from the latest reading";
  }
  return null;
}

/**
 * Factual snapshot for the batch detail callout — check-in cadence, measured
 * change, and the next scheduled milestone. No template "expectation" prose.
 */
export function computeBatchPulse(
  batch: {
    startedAt: number;
    type?: FermentType;
    health: BatchHealth;
    status: string;
  },
  observations: PulseObservation[],
  template: { stages: StageLike[] } | null,
  now: number = Date.now(),
): BatchPulse {
  const sorted = [...observations].sort((a, b) => b.observedAt - a.observedAt);
  const last = sorted[0] ?? null;
  const { line: checkInLine, daysSinceLog } = formatCheckInLine(
    last?.observedAt ?? null,
    batch.startedAt,
    now,
  );

  return {
    checkInLine,
    daysSinceLog,
    measurement: primaryMeasurementDelta(observations, batch.startedAt),
    nextLine:
      batch.status === "active" ? nextMilestoneLine(batch, template, now) : null,
    healthLine: healthExplanation(batch, last, now),
    observationCount: observations.length,
  };
}
