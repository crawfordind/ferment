import { getChip } from "@/lib/chips";
import type { BatchHealth } from "@/lib/schema";
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
  batch: { startedAt: number },
  latestObservation: { chipKeys: string[] } | null,
  template: { stages: StageLike[] },
  now: number = Date.now(),
): BatchHealth {
  let health: BatchHealth = "on_track";

  if (latestObservation) {
    health = maxHealth(health, healthFromChips(latestObservation.chipKeys));
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
