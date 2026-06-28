import { describe, expect, it } from "vitest";

import { getSeedTemplate } from "@/lib/seed-data";
import { currentStage, dayInProcess, isStageActionOverdue } from "@/lib/stages";

const MS_PER_DAY = 86_400_000;
const fpj = getSeedTemplate("fpj")!;
const plant = getSeedTemplate("plant")!;

function at(day: number): number {
  return day * MS_PER_DAY;
}

describe("dayInProcess", () => {
  it("counts whole days since start", () => {
    expect(dayInProcess({ startedAt: 0 }, at(3))).toBe(3);
  });

  it("never goes negative", () => {
    expect(dayInProcess({ startedAt: at(5) }, at(2))).toBe(0);
  });
});

describe("currentStage", () => {
  it("returns the first stage on day 0", () => {
    expect(currentStage({ startedAt: 0 }, fpj, at(0))?.name).toBe("Soak");
  });

  it("moves through stages by day", () => {
    expect(currentStage({ startedAt: 0 }, fpj, at(4))?.name).toBe(
      "Active ferment",
    );
    expect(currentStage({ startedAt: 0 }, fpj, at(7))?.name).toBe("Strain");
  });

  it("stays on the last stage past the end", () => {
    expect(currentStage({ startedAt: 0 }, fpj, at(30))?.name).toBe("Strain");
  });

  it("handles an open-ended final stage", () => {
    const stage = currentStage({ startedAt: 0 }, plant, at(120));
    expect(stage?.name).toBe("Long soak");
    expect(stage?.dayEnd).toBeNull();
  });

  it("returns null for a template with no stages", () => {
    expect(currentStage({ startedAt: 0 }, { stages: [] }, at(1))).toBeNull();
  });
});

describe("isStageActionOverdue", () => {
  it("is true once a finite action window has passed", () => {
    // FPJ "Strain" stage is day 7–7; day 9 is overdue.
    expect(isStageActionOverdue({ startedAt: 0 }, fpj, at(9))).toBe(true);
  });

  it("is false within the action window", () => {
    expect(isStageActionOverdue({ startedAt: 0 }, fpj, at(7))).toBe(false);
  });

  it("is never overdue for an open-ended stage", () => {
    expect(isStageActionOverdue({ startedAt: 0 }, plant, at(365))).toBe(false);
  });
});
