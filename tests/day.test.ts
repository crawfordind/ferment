import { describe, expect, it } from "vitest";

import { computeDayInProcess } from "@/lib/day";

describe("computeDayInProcess", () => {
  it("returns 0 on start day", () => {
    const startedAt = Date.UTC(2026, 0, 1);
    expect(computeDayInProcess(startedAt, startedAt)).toBe(0);
  });

  it("increments by full days", () => {
    const startedAt = Date.UTC(2026, 0, 1);
    const observedAt = startedAt + 3 * 86_400_000;
    expect(computeDayInProcess(startedAt, observedAt)).toBe(3);
  });

  it("never returns negative values", () => {
    const startedAt = Date.UTC(2026, 0, 10);
    const observedAt = Date.UTC(2026, 0, 1);
    expect(computeDayInProcess(startedAt, observedAt)).toBe(0);
  });
});
