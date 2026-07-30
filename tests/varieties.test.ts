import { describe, expect, it } from "vitest";

import {
  SEASON,
  availableInMonth,
  seasonBar,
  weekToMonth,
  windowLabel,
} from "@/lib/varieties";
import type { Variety } from "@/lib/varieties";

const dahlia: Variety = {
  slug: "dahlia",
  name: "Dahlia",
  category: "focal",
  availableFromWeek: 30,
  availableToWeek: 44,
  availableForContract: true,
};

const tulip: Variety = {
  slug: "tulip",
  name: "Tulip",
  category: "focal",
  availableFromWeek: 14,
  availableToWeek: 18,
  availableForContract: true,
};

describe("weekToMonth", () => {
  it("maps early-April and late-October weeks into the season", () => {
    expect(weekToMonth(SEASON.startWeek)).toBe(4); // April
    expect(weekToMonth(SEASON.endWeek)).toBe(10); // October
  });

  it("is monotonic across the season", () => {
    let prev = 0;
    for (let w = SEASON.startWeek; w <= SEASON.endWeek; w++) {
      const m = weekToMonth(w);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });
});

describe("seasonBar", () => {
  it("places a full-season crop across the whole axis", () => {
    const bar = seasonBar({ ...dahlia, availableFromWeek: SEASON.startWeek, availableToWeek: SEASON.endWeek });
    expect(bar.leftPct).toBe(0);
    expect(bar.widthPct).toBeCloseTo(100, 5);
  });

  it("clamps within 0–100 and keeps a visible minimum width", () => {
    const bar = seasonBar({ ...tulip, availableFromWeek: 14, availableToWeek: 14 });
    expect(bar.leftPct).toBeGreaterThanOrEqual(0);
    expect(bar.leftPct).toBeLessThanOrEqual(100);
    expect(bar.widthPct).toBeGreaterThanOrEqual(2);
    expect(bar.leftPct + bar.widthPct).toBeLessThanOrEqual(100.0001);
  });

  it("clamps a crop that extends past the visible season", () => {
    const bar = seasonBar({ ...dahlia, availableFromWeek: 10, availableToWeek: 52 });
    expect(bar.leftPct).toBe(0);
    expect(bar.leftPct + bar.widthPct).toBeLessThanOrEqual(100.0001);
  });
});

describe("availableInMonth", () => {
  it("reports the crop's active months", () => {
    expect(availableInMonth(dahlia, 8)).toBe(true); // August, mid-window
    expect(availableInMonth(dahlia, 4)).toBe(false); // April, before it starts
    expect(availableInMonth(tulip, 4)).toBe(true);
    expect(availableInMonth(tulip, 7)).toBe(false);
  });
});

describe("windowLabel", () => {
  it("renders a single-month window without a dash", () => {
    const label = windowLabel({ ...tulip, availableFromWeek: 14, availableToWeek: 16 });
    expect(label).not.toContain("–");
  });

  it("renders a multi-month window as a range", () => {
    expect(windowLabel(dahlia)).toContain("–");
  });
});
