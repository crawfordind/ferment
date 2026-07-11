import { describe, expect, it } from "vitest";

import {
  computeBatchPulse,
  nextMilestoneLine,
  primaryMeasurementDelta,
} from "@/lib/batch-pulse";
import { buildMeasurementSeries } from "@/lib/measurement-series";
import { getSeedTemplate } from "@/lib/seed-data";

const MS_PER_DAY = 86_400_000;
const labs = getSeedTemplate("labs")!;

function at(day: number): number {
  return day * MS_PER_DAY;
}

describe("primaryMeasurementDelta", () => {
  it("returns null with fewer than two readings", () => {
    expect(
      primaryMeasurementDelta(
        [{ observedAt: at(2), ph: 4.2, chipKeys: [] }],
        0,
      ),
    ).toBeNull();
  });

  it("prefers pH and reports first→latest change", () => {
    const delta = primaryMeasurementDelta(
      [
        { observedAt: at(2), ph: 4.5, brix: 12, chipKeys: [] },
        { observedAt: at(5), ph: 3.8, brix: 8, chipKeys: [] },
      ],
      0,
    );
    expect(delta).not.toBeNull();
    expect(delta!.metric).toBe("ph");
    expect(delta!.from).toBe(4.5);
    expect(delta!.to).toBe(3.8);
    expect(delta!.fromDay).toBe(2);
    expect(delta!.toDay).toBe(5);
    expect(delta!.delta).toBeCloseTo(-0.7);
  });
});

describe("nextMilestoneLine", () => {
  it("names the next stage by days remaining", () => {
    // LABS stages: check seed — typically has a strain/collect action.
    const line = nextMilestoneLine({ startedAt: 0 }, labs, at(3));
    expect(line).toBeTruthy();
    expect(line).toMatch(/in \d+ days|tomorrow|today|overdue/i);
  });

  it("flags an overdue stage action", () => {
    const template = {
      stages: [
        {
          stageIndex: 0,
          name: "Ferment",
          dayStart: 0,
          dayEnd: 5,
          expectationText: "",
          actionLabel: "Strain",
        },
      ],
    };
    expect(nextMilestoneLine({ startedAt: 0 }, template, at(7))).toBe(
      "Strain overdue",
    );
    expect(nextMilestoneLine({ startedAt: 0 }, template, at(5))).toBe(
      "Strain today",
    );
  });
});

describe("computeBatchPulse", () => {
  it("summarizes check-in cadence and measured change", () => {
    const pulse = computeBatchPulse(
      {
        startedAt: 0,
        type: "labs",
        health: "on_track",
        status: "active",
      },
      [
        { observedAt: at(2), ph: 4.5, chipKeys: [] },
        { observedAt: at(5), ph: 3.9, chipKeys: [] },
      ],
      labs,
      at(5),
    );

    expect(pulse.checkInLine).toMatch(/Logged today/);
    expect(pulse.daysSinceLog).toBe(0);
    expect(pulse.measurement?.delta).toBeCloseTo(-0.6);
    expect(pulse.observationCount).toBe(2);
    expect(pulse.healthLine).toBeNull();
  });

  it("explains a watch from high pH", () => {
    const pulse = computeBatchPulse(
      {
        startedAt: 0,
        type: "labs",
        health: "watch",
        status: "active",
      },
      [{ observedAt: at(6), ph: 5.0, chipKeys: [] }],
      labs,
      at(6),
    );
    expect(pulse.healthLine).toMatch(/pH 5/);
  });
});

describe("buildMeasurementSeries", () => {
  it("builds chronological series per metric", () => {
    const series = buildMeasurementSeries(
      [
        { id: "a", observedAt: at(1), ph: 4.5, tempC: 22 },
        { id: "b", observedAt: at(3), ph: 4.0 },
        { id: "c", observedAt: at(4), brix: 10 },
      ],
      0,
    );

    expect(series.map((s) => s.metric)).toEqual(["ph", "brix", "tempC"]);
    expect(series[0].points).toHaveLength(2);
    expect(series[0].delta).toBeCloseTo(-0.5);
    expect(series[1].latest).toBe(10);
  });
});
