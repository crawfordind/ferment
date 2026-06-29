import { describe, expect, it } from "vitest";

import { costPerUnit, formatCostPerUnit } from "@/lib/economics";

describe("costPerUnit", () => {
  it("divides cost by yield", () => {
    expect(costPerUnit(10, 5, "L")).toEqual({ value: 2, unit: "L" });
  });

  it("falls back to a generic unit label", () => {
    expect(costPerUnit(10, 5, null)?.unit).toBe("unit");
  });

  it("returns null without both a cost and a positive yield", () => {
    expect(costPerUnit(null, 5, "L")).toBeNull();
    expect(costPerUnit(10, null, "L")).toBeNull();
    expect(costPerUnit(10, 0, "L")).toBeNull();
  });
});

describe("formatCostPerUnit", () => {
  it("formats with currency and unit", () => {
    expect(formatCostPerUnit({ value: 1.2, unit: "L" })).toBe("$1.20 / L");
  });

  it("returns null for null input", () => {
    expect(formatCostPerUnit(null)).toBeNull();
  });
});
