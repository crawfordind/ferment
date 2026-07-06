import { describe, expect, it } from "vitest";

import {
  computeInsights,
  type InsightBatch,
  type InsightTemplate,
} from "@/lib/insights";

const DAY = 86_400_000;
// A fixed local-noon "now" keeps day-bucketing away from midnight edges.
const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime();

function batch(overrides: Partial<InsightBatch> = {}): InsightBatch {
  return {
    id: "b1",
    name: "FPJ Batch",
    code: "FPJ-01",
    status: "active",
    startedAt: NOW,
    ...overrides,
  };
}

// Two-stage template: active ferment, then a "Strain" collection step at day 7.
const twoStage: InsightTemplate = {
  stages: [
    { stageIndex: 0, name: "Ferment", dayStart: 0, dayEnd: 6, actionLabel: "Check daily" },
    { stageIndex: 1, name: "Strain", dayStart: 7, dayEnd: 7, actionLabel: "Strain" },
  ],
};

// Single open-ended stage (food/custom) — no scheduled transition or harvest.
const openStage: InsightTemplate = {
  stages: [{ stageIndex: 0, name: "Ferment", dayStart: 0, dayEnd: null, actionLabel: "Check in" }],
};

const templateFor = () => twoStage;

describe("computeInsights — logging streak", () => {
  it("counts logs in the trailing week and builds the active-day map", () => {
    const observations = [
      { observedAt: NOW }, // today
      { observedAt: NOW - DAY }, // yesterday
      { observedAt: NOW - DAY - 1000 }, // also yesterday (same day bucket)
      { observedAt: NOW - 3 * DAY }, // 3 days ago
      { observedAt: NOW - 30 * DAY }, // outside the window
    ];
    const result = computeInsights({ batches: [], observations, templateFor, now: NOW });

    expect(result.loggedThisWeek).toBe(4);
    // Oldest → today; today is index 6.
    expect(result.activeDays[6]).toBe(true); // today
    expect(result.activeDays[5]).toBe(true); // yesterday
    expect(result.activeDays[3]).toBe(true); // 3 days ago
    expect(result.activeDays[4]).toBe(false);
  });

  it("measures the current streak as consecutive days ending today", () => {
    const observations = [
      { observedAt: NOW },
      { observedAt: NOW - DAY },
      { observedAt: NOW - 2 * DAY },
      // gap at day -3
      { observedAt: NOW - 4 * DAY },
    ];
    const result = computeInsights({ batches: [], observations, templateFor, now: NOW });
    expect(result.currentStreak).toBe(3);
  });

  it("reports a zero streak when today has no log", () => {
    const observations = [{ observedAt: NOW - DAY }];
    const result = computeInsights({ batches: [], observations, templateFor, now: NOW });
    expect(result.currentStreak).toBe(0);
    expect(result.loggedThisWeek).toBe(1);
  });
});

describe("computeInsights — upcoming transitions", () => {
  it("surfaces the next unreached stage with days remaining", () => {
    const b = batch({ startedAt: NOW - 2 * DAY }); // day 2, next stage at day 7
    const result = computeInsights({ batches: [b], observations: [], templateFor, now: NOW });
    expect(result.upcomingTransitions).toHaveLength(1);
    expect(result.upcomingTransitions[0]).toMatchObject({
      batchCode: "FPJ-01",
      stageName: "Strain",
      inDays: 5,
    });
  });

  it("sorts transitions soonest-first and respects the limit", () => {
    const batches = [
      batch({ id: "a", code: "A", startedAt: NOW - 1 * DAY }), // 6 days out
      batch({ id: "b", code: "B", startedAt: NOW - 5 * DAY }), // 2 days out
    ];
    const result = computeInsights({
      batches,
      observations: [],
      templateFor,
      now: NOW,
      limit: 1,
    });
    expect(result.upcomingTransitions).toHaveLength(1);
    expect(result.upcomingTransitions[0].batchCode).toBe("B");
  });

  it("ignores archived/finished batches", () => {
    const b = batch({ status: "finished", startedAt: NOW - 2 * DAY });
    const result = computeInsights({ batches: [b], observations: [], templateFor, now: NOW });
    expect(result.upcomingTransitions).toHaveLength(0);
  });
});

describe("computeInsights — harvest reminders", () => {
  it("flags a batch that has reached its terminal collection step", () => {
    const b = batch({ startedAt: NOW - 7 * DAY }); // day 7 == Strain
    const result = computeInsights({ batches: [b], observations: [], templateFor, now: NOW });
    expect(result.upcomingTransitions).toHaveLength(0);
    expect(result.harvestReminders).toHaveLength(1);
    expect(result.harvestReminders[0]).toMatchObject({ actionLabel: "Strain", overdue: false });
  });

  it("marks a harvest overdue once past the stage's dayEnd", () => {
    const b = batch({ startedAt: NOW - 10 * DAY }); // day 10 > dayEnd 7
    const result = computeInsights({ batches: [b], observations: [], templateFor, now: NOW });
    expect(result.harvestReminders[0].overdue).toBe(true);
  });

  it("does not treat single open-ended stages as harvestable", () => {
    const b = batch({ startedAt: NOW - 10 * DAY });
    const result = computeInsights({
      batches: [b],
      observations: [],
      templateFor: () => openStage,
      now: NOW,
    });
    expect(result.harvestReminders).toHaveLength(0);
    expect(result.upcomingTransitions).toHaveLength(0);
  });
});
