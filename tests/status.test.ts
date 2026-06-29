import { describe, expect, it } from "vitest";

import { getSeedTemplate } from "@/lib/seed-data";
import { computeHealth, healthFromChips, healthFromPh } from "@/lib/status";

const MS_PER_DAY = 86_400_000;
const fpj = getSeedTemplate("fpj")!;
const food = getSeedTemplate("food")!;

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

  it("escalates to watch when a lacto ferment's pH stays high past its window", () => {
    expect(
      computeHealth(
        { startedAt: 0, type: "food" },
        { chipKeys: [], ph: 5.2 },
        food,
        at(6),
      ),
    ).toBe("watch");
  });

  it("stays on_track when a high pH is still within the early window", () => {
    expect(
      computeHealth(
        { startedAt: 0, type: "food" },
        { chipKeys: [], ph: 5.2 },
        food,
        at(2),
      ),
    ).toBe("on_track");
  });
});

describe("healthFromPh", () => {
  it("is on_track once a lacto ferment has acidified", () => {
    expect(healthFromPh("food", 3.8, 6)).toBe("on_track");
  });

  it("is watch when pH stays above the ceiling past the window", () => {
    expect(healthFromPh("food", 4.8, 6)).toBe("watch");
    expect(healthFromPh("labs", 5.0, 6)).toBe("watch");
  });

  it("is on_track before the check-after day even if pH is high", () => {
    expect(healthFromPh("food", 5.0, 1)).toBe("on_track");
  });

  it("is on_track for types without a pH rule, or with no reading", () => {
    expect(healthFromPh("fpj", 6.0, 30)).toBe("on_track");
    expect(healthFromPh("food", null, 10)).toBe("on_track");
    expect(healthFromPh(undefined, 6.0, 10)).toBe("on_track");
  });
});
