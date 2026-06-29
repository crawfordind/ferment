import { describe, expect, it } from "vitest";

import {
  computeRatio,
  computeSaltPercent,
  parseInputs,
  serializeInputs,
  type BatchInput,
} from "@/lib/inputs";

describe("parseInputs / serializeInputs", () => {
  it("round-trips a clean list", () => {
    const inputs: BatchInput[] = [
      { name: "Nettle", quantity: 1, unit: "kg" },
      { name: "Brown sugar", quantity: 1, unit: "kg" },
    ];
    const json = serializeInputs(inputs);
    expect(parseInputs(json)).toEqual(inputs);
  });

  it("returns [] for null, empty, or malformed JSON", () => {
    expect(parseInputs(null)).toEqual([]);
    expect(parseInputs("")).toEqual([]);
    expect(parseInputs("not json")).toEqual([]);
    expect(parseInputs("{}")).toEqual([]);
  });

  it("drops nameless rows and serializes null when nothing remains", () => {
    expect(
      serializeInputs([{ name: "  ", quantity: 1, unit: "kg" }]),
    ).toBeNull();
    expect(parseInputs('[{"name":"","quantity":1,"unit":"kg"}]')).toEqual([]);
  });

  it("coerces a missing/invalid quantity to null", () => {
    const parsed = parseInputs('[{"name":"Cabbage","unit":"kg"}]');
    expect(parsed).toEqual([{ name: "Cabbage", quantity: null, unit: "kg" }]);
  });
});

describe("computeRatio", () => {
  it("reports 1 : 1 for equal weights (FPJ)", () => {
    expect(
      computeRatio([
        { name: "Nettle", quantity: 1, unit: "kg" },
        { name: "Sugar", quantity: 1, unit: "kg" },
      ]),
    ).toBe("1 : 1");
  });

  it("normalizes across units (1 kg : 500 g => 2 : 1)", () => {
    expect(
      computeRatio([
        { name: "Fruit", quantity: 1, unit: "kg" },
        { name: "Sugar", quantity: 500, unit: "g" },
      ]),
    ).toBe("2 : 1");
  });

  it("returns null with fewer than two comparable inputs", () => {
    expect(
      computeRatio([{ name: "Nettle", quantity: 1, unit: "kg" }]),
    ).toBeNull();
  });

  it("normalizes imperial mass units (2 lb : 1 lb => 2 : 1)", () => {
    expect(
      computeRatio([
        { name: "Fruit", quantity: 2, unit: "lb" },
        { name: "Sugar", quantity: 1, unit: "lb" },
      ]),
    ).toBe("2 : 1");
  });

  it("normalizes imperial volume units (1 gal : 1 gal => 1 : 1)", () => {
    expect(
      computeRatio([
        { name: "Water", quantity: 1, unit: "gal" },
        { name: "Whey", quantity: 1, unit: "gal" },
      ]),
    ).toBe("1 : 1");
  });
});

describe("computeSaltPercent", () => {
  it("computes salt as a percent of total mass", () => {
    const percent = computeSaltPercent([
      { name: "Cabbage", quantity: 1, unit: "kg" },
      { name: "Sea salt", quantity: 25, unit: "g" },
    ]);
    expect(percent).toBeCloseTo(2.4390244, 4);
  });

  it("returns null without a salt input", () => {
    expect(
      computeSaltPercent([{ name: "Cabbage", quantity: 1, unit: "kg" }]),
    ).toBeNull();
  });
});
