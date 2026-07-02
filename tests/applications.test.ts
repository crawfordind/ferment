import { describe, expect, it } from "vitest";

import {
  doseLabel,
  parseApplication,
  serializeApplication,
  summarizeApplication,
  type Application,
} from "@/lib/applications";

const full: Application = {
  target: "Tomato bed",
  dilution: "1:1000",
  waterValue: 15,
  waterUnit: "L",
  doseMinMl: 15,
  doseMaxMl: 15,
};

describe("serialize/parse round-trip", () => {
  it("round-trips a full application", () => {
    const json = serializeApplication(full);
    expect(json).not.toBeNull();
    expect(parseApplication(json)).toEqual(full);
  });

  it("returns null when the target is empty", () => {
    expect(serializeApplication({ ...full, target: "   " })).toBeNull();
  });

  it("tolerates malformed or empty JSON", () => {
    expect(parseApplication(null)).toBeNull();
    expect(parseApplication("not json")).toBeNull();
    expect(parseApplication("{}")).toBeNull();
    expect(parseApplication('{"target":""}')).toBeNull();
  });

  it("drops non-finite numeric fields", () => {
    const parsed = parseApplication('{"target":"Bed","waterValue":"lots"}');
    expect(parsed).toEqual({
      target: "Bed",
      dilution: null,
      waterValue: null,
      waterUnit: null,
      doseMinMl: null,
      doseMaxMl: null,
    });
  });
});

describe("doseLabel", () => {
  it("collapses a point dose", () => {
    expect(doseLabel(full)).toBe("15 mL");
  });

  it("returns null when no dose was recorded", () => {
    expect(doseLabel({ target: "Bed" })).toBeNull();
  });
});

describe("summarizeApplication", () => {
  it("builds a readable one-liner", () => {
    expect(summarizeApplication(full)).toBe(
      "Applied to Tomato bed · 1:1000 · 15 mL in 15 L",
    );
  });

  it("degrades gracefully with only a target", () => {
    expect(summarizeApplication({ target: "Seed trays" })).toBe(
      "Applied to Seed trays",
    );
  });
});
