import { describe, expect, it } from "vitest";

import {
  defaultUnitFor,
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

  it("offers imperial units for imperial", () => {
    expect(quantityUnitsFor("imperial")).toEqual(["lb", "oz", "gal", "fl oz"]);
  });
});

describe("unitDimension", () => {
  it("classifies mass and volume units across systems", () => {
    expect(unitDimension("kg")).toBe("mass");
    expect(unitDimension("lb")).toBe("mass");
    expect(unitDimension("ml")).toBe("volume");
    expect(unitDimension("fl oz")).toBe("volume");
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
      "fl oz",
    ]);
  });

  it("ignores blank current values", () => {
    expect(unitOptions("metric", "")).toEqual(["kg", "g", "L", "ml"]);
    expect(unitOptions("metric", null)).toEqual(["kg", "g", "L", "ml"]);
  });
});
