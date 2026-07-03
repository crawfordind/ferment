import { describe, expect, it } from "vitest";

import {
  doseForWater,
  formatDose,
  formatDoseRange,
  formatMl,
  parseDilutionRatio,
  volumeToMl,
} from "@/lib/dilution";

describe("parseDilutionRatio", () => {
  it("parses a single ratio", () => {
    expect(parseDilutionRatio("1:1000")).toEqual({ min: 1000, max: 1000 });
  });

  it("parses an en-dash range", () => {
    expect(parseDilutionRatio("1:800–1:1000")).toEqual({ min: 800, max: 1000 });
  });

  it("parses a hyphen range with spaces", () => {
    expect(parseDilutionRatio("1:500 - 1:1000")).toEqual({
      min: 500,
      max: 1000,
    });
  });

  it("falls back to bare numbers when no ratios present", () => {
    expect(parseDilutionRatio("500")).toEqual({ min: 500, max: 500 });
  });

  it("prefers explicit ratios over stray numbers", () => {
    // The "20" in a note should not be treated as a denominator.
    expect(parseDilutionRatio("1:1000 (per 20 L tank)")).toEqual({
      min: 1000,
      max: 1000,
    });
  });

  it("returns null for empty or unusable input", () => {
    expect(parseDilutionRatio(null)).toBeNull();
    expect(parseDilutionRatio("")).toBeNull();
    expect(parseDilutionRatio("foliar spray")).toBeNull();
  });
});

describe("volumeToMl", () => {
  it("converts litres and gallons", () => {
    expect(volumeToMl(15, "L")).toBe(15000);
    expect(volumeToMl(1, "mL")).toBe(1);
    expect(volumeToMl(1, "gal")).toBeCloseTo(3785.41, 1);
  });

  it("rejects unknown units and bad values", () => {
    expect(volumeToMl(1, "cups")).toBeNull();
    expect(volumeToMl(null, "L")).toBeNull();
    expect(volumeToMl(-1, "L")).toBeNull();
  });
});

describe("doseForWater", () => {
  it("computes a point dose for a single ratio", () => {
    // 15 L at 1:1000 → 15 mL.
    const dose = doseForWater(15000, { min: 1000, max: 1000 });
    expect(dose.minMl).toBeCloseTo(15);
    expect(dose.maxMl).toBeCloseTo(15);
  });

  it("weaker ratio (larger denominator) needs less concentrate", () => {
    const dose = doseForWater(15000, { min: 800, max: 1000 });
    // 15000/1000 = 15 (min), 15000/800 = 18.75 (max).
    expect(dose.minMl).toBeCloseTo(15);
    expect(dose.maxMl).toBeCloseTo(18.75);
  });
});

describe("formatting", () => {
  it("rounds by magnitude", () => {
    expect(formatMl(150.4)).toBe("150 mL");
    expect(formatMl(18.75)).toBe("18.8 mL");
    expect(formatMl(1.234)).toBe("1.23 mL");
  });

  it("collapses a point range", () => {
    expect(formatDoseRange({ minMl: 15, maxMl: 15 })).toBe("15 mL");
  });

  it("shows a range when min and max differ", () => {
    expect(formatDoseRange({ minMl: 15, maxMl: 18.75 })).toBe("15 mL–18.8 mL");
  });
});

describe("formatDose (system-aware)", () => {
  it("uses millilitres for metric", () => {
    expect(formatDose({ minMl: 15, maxMl: 15 }, "metric")).toBe("15 mL");
  });

  it("converts to fluid ounces for imperial", () => {
    // 29.57 mL ≈ 1 fl oz.
    expect(formatDose({ minMl: 29.5735295625, maxMl: 29.5735295625 }, "imperial")).toBe(
      "1 fl oz",
    );
  });

  it("shows an imperial range", () => {
    expect(formatDose({ minMl: 15, maxMl: 18.75 }, "imperial")).toBe(
      "0.51 fl oz–0.63 fl oz",
    );
  });
});
