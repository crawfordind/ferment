import { describe, expect, it } from "vitest";

import {
  convertQuantity,
  defaultUnitFor,
  formatAmount,
  formatQuantity,
  preferredUnit,
  quantityUnitsFor,
  temperatureUnitFor,
  unitDimension,
  unitOptions,
} from "@/lib/units";

describe("temperatureUnitFor", () => {
  it("maps each system to its temperature unit", () => {
    expect(temperatureUnitFor("metric")).toBe("C");
    expect(temperatureUnitFor("imperial")).toBe("F");
  });
});

describe("quantityUnitsFor", () => {
  it("offers metric units for metric", () => {
    expect(quantityUnitsFor("metric")).toEqual(["kg", "g", "L", "ml"]);
  });

  it("offers standard US units for imperial, including cups", () => {
    expect(quantityUnitsFor("imperial")).toEqual([
      "lb",
      "oz",
      "gal",
      "qt",
      "pt",
      "cup",
      "fl oz",
      "tbsp",
      "tsp",
    ]);
  });
});

describe("unitDimension", () => {
  it("classifies mass and volume units across systems", () => {
    expect(unitDimension("kg")).toBe("mass");
    expect(unitDimension("lb")).toBe("mass");
    expect(unitDimension("ml")).toBe("volume");
    expect(unitDimension("fl oz")).toBe("volume");
  });

  it("recognizes standard US volume units", () => {
    expect(unitDimension("cup")).toBe("volume");
    expect(unitDimension("qt")).toBe("volume");
    expect(unitDimension("pt")).toBe("volume");
    expect(unitDimension("tbsp")).toBe("volume");
    expect(unitDimension("tsp")).toBe("volume");
  });

  it("is case-insensitive and trims", () => {
    expect(unitDimension(" L ")).toBe("volume");
    expect(unitDimension("GAL")).toBe("volume");
  });

  it("returns null for unknown units", () => {
    expect(unitDimension("stone")).toBeNull();
  });
});

describe("defaultUnitFor", () => {
  it("returns the system's preferred unit per dimension", () => {
    expect(defaultUnitFor("mass", "metric")).toBe("kg");
    expect(defaultUnitFor("mass", "imperial")).toBe("lb");
    expect(defaultUnitFor("volume", "metric")).toBe("L");
    expect(defaultUnitFor("volume", "imperial")).toBe("gal");
  });
});

describe("preferredUnit", () => {
  it("translates a metric default into the imperial equivalent dimension", () => {
    expect(preferredUnit("kg", "imperial")).toBe("lb");
    expect(preferredUnit("L", "imperial")).toBe("gal");
  });

  it("leaves units unchanged when already in the system", () => {
    expect(preferredUnit("kg", "metric")).toBe("kg");
  });

  it("passes unknown units through untouched", () => {
    expect(preferredUnit("each", "imperial")).toBe("each");
  });
});

describe("unitOptions", () => {
  it("returns the plain system list when current is already included", () => {
    expect(unitOptions("metric", "kg")).toEqual(["kg", "g", "L", "ml"]);
  });

  it("prepends a current unit from the other system so it stays selectable", () => {
    expect(unitOptions("imperial", "kg")).toEqual([
      "kg",
      "lb",
      "oz",
      "gal",
      "qt",
      "pt",
      "cup",
      "fl oz",
      "tbsp",
      "tsp",
    ]);
  });

  it("ignores blank current values", () => {
    expect(unitOptions("metric", "")).toEqual(["kg", "g", "L", "ml"]);
    expect(unitOptions("metric", null)).toEqual(["kg", "g", "L", "ml"]);
  });
});

describe("convertQuantity", () => {
  it("converts kg to lb for an imperial user", () => {
    const { value, unit } = convertQuantity(5, "kg", "imperial");
    expect(value).toBeCloseTo(11.0231, 3);
    expect(unit).toBe("lb");
  });

  it("preserves the small tier (g → oz, mL → fl oz)", () => {
    expect(convertQuantity(500, "g", "imperial").unit).toBe("oz");
    expect(convertQuantity(250, "mL", "imperial").unit).toBe("fl oz");
  });

  it("converts imperial back to metric (gal → L)", () => {
    const { value, unit } = convertQuantity(1, "gal", "metric");
    expect(value).toBeCloseTo(3.7854, 3);
    expect(unit).toBe("L");
  });

  it("is a no-op when the unit already suits the system", () => {
    expect(convertQuantity(2, "kg", "metric")).toEqual({ value: 2, unit: "kg" });
  });

  it("normalizes case for the source unit", () => {
    // "L" and "ML" resolve to the volume factors regardless of case.
    expect(convertQuantity(1, "L", "metric").unit).toBe("L");
    expect(convertQuantity(1, "L", "imperial").unit).toBe("gal");
  });

  it("passes unrecognized units through untouched", () => {
    expect(convertQuantity(3, "part", "imperial")).toEqual({
      value: 3,
      unit: "part",
    });
  });

  it("keeps a US unit the user picked in their own system (cups stay cups)", () => {
    expect(convertQuantity(2, "cup", "imperial")).toEqual({
      value: 2,
      unit: "cup",
    });
    expect(convertQuantity(0.5, "tsp", "imperial")).toEqual({
      value: 0.5,
      unit: "tsp",
    });
  });

  it("converts a US amount viewed in metric by tier (cups → mL)", () => {
    // A US recipe logged in cups reads in mL for a metric user, keeping the
    // small-volume tier so cross-system amounts stay meaningful.
    const cupsInMetric = convertQuantity(4, "cup", "metric");
    expect(cupsInMetric.unit).toBe("mL");
    expect(cupsInMetric.value).toBeCloseTo(946.35, 1);
  });

  it("preserves decimal quantities through conversion", () => {
    const { value } = convertQuantity(1.5, "kg", "imperial");
    expect(value).toBeCloseTo(3.3069, 3);
  });
});

describe("formatAmount / formatQuantity", () => {
  it("trims trailing zeros", () => {
    expect(formatAmount(5)).toBe("5");
    expect(formatAmount(2.2)).toBe("2.2");
    expect(formatAmount(11.0231)).toBe("11.02");
  });

  it("formats a converted quantity with its unit", () => {
    expect(formatQuantity(5, "kg", "imperial")).toBe("11.02 lb");
    expect(formatQuantity(5, "kg", "metric")).toBe("5 kg");
  });
});
