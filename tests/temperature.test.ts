import { describe, expect, it } from "vitest";

import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature,
  fromCelsius,
  toCelsius,
  unitSuffix,
} from "@/lib/temperature";

describe("temperature conversion", () => {
  it("converts Celsius to Fahrenheit", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(37)).toBeCloseTo(98.6);
  });

  it("converts Fahrenheit to Celsius", () => {
    expect(fahrenheitToCelsius(32)).toBe(0);
    expect(fahrenheitToCelsius(212)).toBe(100);
    expect(fahrenheitToCelsius(98.6)).toBeCloseTo(37);
  });

  it("round-trips a value back to Celsius for storage", () => {
    expect(toCelsius(fromCelsius(21.5, "F"), "F")).toBeCloseTo(21.5, 1);
  });
});

describe("fromCelsius", () => {
  it("leaves Celsius unchanged", () => {
    expect(fromCelsius(21.5, "C")).toBe(21.5);
  });

  it("converts to Fahrenheit rounded to one decimal", () => {
    expect(fromCelsius(21.5, "F")).toBe(70.7);
  });

  it("returns null for missing readings", () => {
    expect(fromCelsius(null, "F")).toBeNull();
    expect(fromCelsius(undefined, "C")).toBeNull();
  });
});

describe("toCelsius", () => {
  it("leaves Celsius unchanged", () => {
    expect(toCelsius(21.5, "C")).toBe(21.5);
  });

  it("converts Fahrenheit input to Celsius", () => {
    expect(toCelsius(70.7, "F")).toBeCloseTo(21.5, 1);
  });

  it("returns null for blank or invalid input", () => {
    expect(toCelsius(null, "F")).toBeNull();
    expect(toCelsius(undefined, "C")).toBeNull();
    expect(toCelsius(Number.NaN, "C")).toBeNull();
  });
});

describe("formatTemperature", () => {
  it("appends the correct unit suffix", () => {
    expect(formatTemperature(21.5, "C")).toBe("21.5°C");
    expect(formatTemperature(21.5, "F")).toBe("70.7°F");
  });

  it("returns null when there is no reading", () => {
    expect(formatTemperature(null, "C")).toBeNull();
  });
});

describe("unitSuffix", () => {
  it("returns the degree suffix for each unit", () => {
    expect(unitSuffix("C")).toBe("°C");
    expect(unitSuffix("F")).toBe("°F");
  });
});
