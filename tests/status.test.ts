import { describe, expect, it } from "vitest";

import { getSeedTemplate } from "@/lib/seed-data";
import { computeHealth, healthFromChips } from "@/lib/status";

const MS_PER_DAY = 86_400_000;
const fpj = getSeedTemplate("fpj")!;

function at(day: number): number {
  return day * MS_PER_DAY;
}

describe("healthFromChips", () => {
  it("is on_track with no chips or only neutral chips", () => {
    expect(healthFromChips([])).toBe("on_track");
    expect(healthFromChips(["smell_sweet", "activity_bubbling_lots"])).toBe(
      "on_track",
    );
  });

  it("is watch for a mild warning chip (ammonia)", () => {
    expect(healthFromChips(["smell_ammonia"])).toBe("watch");
  });

  it("is needs_action for spoilage chips", () => {
    expect(healthFromChips(["smell_rotten"])).toBe("needs_action");
    expect(healthFromChips(["surface_fuzzy_mold"])).toBe("needs_action");
    expect(healthFromChips(["surface_slime"])).toBe("needs_action");
  });

  it("takes the most severe of mixed chips", () => {
    expect(healthFromChips(["smell_sweet", "smell_ammonia"])).toBe("watch");
    expect(healthFromChips(["smell_ammonia", "smell_rotten"])).toBe(
      "needs_action",
    );
  });
});

describe("computeHealth", () => {
  it("is on_track within a stage with no warning chips", () => {
    expect(
      computeHealth({ startedAt: 0 }, { chipKeys: ["smell_sweet"] }, fpj, at(4)),
    ).toBe("on_track");
  });

  it("escalates from a warning chip on the latest observation", () => {
    expect(
      computeHealth({ startedAt: 0 }, { chipKeys: ["smell_rotten"] }, fpj, at(4)),
    ).toBe("needs_action");
  });

  it("escalates to needs_action when a stage action is overdue", () => {
    // Day 9: past the FPJ "Strain" window (day 7), no observation.
    expect(computeHealth({ startedAt: 0 }, null, fpj, at(9))).toBe(
      "needs_action",
    );
  });

  it("stays on_track with no observation inside the schedule", () => {
    expect(computeHealth({ startedAt: 0 }, null, fpj, at(2))).toBe("on_track");
  });
});
