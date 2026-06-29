import { getChip } from "@/lib/chips";
import type { BatchHealth, FermentType } from "@/lib/schema";
import {
  currentStage,
  dayInProcess,
  type StageLike,
} from "@/lib/stages";

/** Warning chips that signal likely spoilage — push straight to needs_action. */
const NEEDS_ACTION_CHIPS = new Set([
  "smell_rotten",
  "surface_fuzzy_mold",
  "surface_slime",
]);

/**
 * Conservative pH ceilings for lacto-type ferments: past `afterDay`, a pH still
 * above `ceiling` means it hasn't acidified as expected — a "watch", never
 * needs_action on pH alone. Only defined where a threshold is defensible.
 */
const PH_RULES: Partial<Record<FermentType, { ceiling: number; afterDay: number }>> = {
  labs: { ceiling: 4.5, afterDay: 5 },
  food: { ceiling: 4.6, afterDay: 4 },
};

/** Health implied by a pH reading for a given ferment type and day-in-process. */
export function healthFromPh(
  type: FermentType | undefined,
  ph: number | null | undefined,
  day: number,
): BatchHealth {
  if (!type || ph === null || ph === undefined || !Number.isFinite(ph)) {
    return "on_track";
  }
  const rule = PH_RULES[type];
  if (!rule) {
    return "on_track";
  }
  return day >= rule.afterDay && ph > rule.ceiling ? "watch" : "on_track";
}

const SEVERITY_RANK: Record<BatchHealth, number> = {
  on_track: 0,
  watch: 1,
  needs_action: 2,
};

function maxHealth(a: BatchHealth, b: BatchHealth): BatchHealth {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/** Health implied purely by the selected sensory chips. */
export function healthFromChips(chipKeys: string[]): BatchHealth {
  let health: BatchHealth = "on_track";
  for (const key of chipKeys) {
    const chip = getChip(key);
    if (!chip || chip.severity !== "warning") {
      continue;
    }
    health = maxHealth(
      health,
      NEEDS_ACTION_CHIPS.has(key) ? "needs_action" : "watch",
    );
  }
  return health;
}

/**
 * Pure status engine: combines warning chips on the latest observation with
 * stage-action timing. Returns the most severe signal.
 */
export function computeHealth(
  batch: { startedAt: number; type?: FermentType },
  latestObservation: { chipKeys: string[]; ph?: number | null } | null,
  template: { stages: StageLike[] },
  now: number = Date.now(),
): BatchHealth {
  let health: BatchHealth = "on_track";

  if (latestObservation) {
    health = maxHealth(health, healthFromChips(latestObservation.chipKeys));
    health = maxHealth(
      health,
      healthFromPh(batch.type, latestObservation.ph, dayInProcess(batch, now)),
    );
  }

  const stage = currentStage(batch, template, now);
  if (
    stage &&
    stage.actionLabel &&
    stage.dayEnd !== null &&
    dayInProcess(batch, now) > stage.dayEnd
  ) {
    health = maxHealth(health, "needs_action");
  }

  return health;
}
