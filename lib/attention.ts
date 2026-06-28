import type { BatchHealth } from "@/lib/schema";
import { currentStage, dayInProcess, type StageLike } from "@/lib/stages";

export type AttentionReason =
  | "overdue"
  | "needs_action"
  | "due_today"
  | "watch"
  | null;

export type Attention = {
  needsAttention: boolean;
  reason: AttentionReason;
  hint: string | null;
  /** Higher = more urgent; used to sort the Home "needs attention" group. */
  priority: number;
};

const NONE: Attention = {
  needsAttention: false,
  reason: null,
  hint: null,
  priority: 0,
};

type Signal = { reason: Exclude<AttentionReason, null>; hint: string; priority: number };

/**
 * What (if anything) makes a batch need attention today: a due/overdue discrete
 * stage action, or a health signal (needs_action / watch). Returns the most
 * urgent signal, preferring concrete action hints on ties.
 */
export function computeAttention(
  batch: { startedAt: number; status: string; health: BatchHealth },
  template: { stages: StageLike[] } | null,
  now: number = Date.now(),
): Attention {
  if (batch.status !== "active") {
    return NONE;
  }

  const signals: Signal[] = [];

  // Discrete stage action (single-day window, e.g. Strain/Collect/Harvest).
  const stage = template ? currentStage(batch, template, now) : null;
  if (
    stage?.actionLabel &&
    stage.dayEnd !== null &&
    stage.dayStart === stage.dayEnd
  ) {
    const day = dayInProcess(batch, now);
    if (day > stage.dayEnd) {
      signals.push({
        reason: "overdue",
        hint: `${stage.actionLabel} overdue`,
        priority: 4,
      });
    } else if (day === stage.dayEnd) {
      signals.push({
        reason: "due_today",
        hint: `${stage.actionLabel} today`,
        priority: 2,
      });
    }
  }

  // Health-derived signal.
  if (batch.health === "needs_action") {
    signals.push({
      reason: "needs_action",
      hint: "Worth a look",
      priority: 3,
    });
  } else if (batch.health === "watch") {
    signals.push({ reason: "watch", hint: "Keep an eye on it", priority: 1 });
  }

  if (signals.length === 0) {
    return NONE;
  }

  // Most urgent by priority; ties favor the concrete action hint (listed first).
  const best = signals.reduce((a, b) => (b.priority > a.priority ? b : a));
  return {
    needsAttention: true,
    reason: best.reason,
    hint: best.hint,
    priority: best.priority,
  };
}
