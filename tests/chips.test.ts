import { describe, expect, it } from "vitest";

import { getChip, getChipsForType } from "@/lib/chips";
import { getSeedTemplate } from "@/lib/seed-data";

describe("chips config", () => {
  it("resolves primary and more chips for each type", () => {
    const { primary, more } = getChipsForType("fpj");
    expect(primary.length).toBeGreaterThan(0);
    expect(more.length).toBeGreaterThan(0);
    expect(primary.every((chip) => !more.some((m) => m.key === chip.key))).toBe(
      true,
    );
  });

  it("marks caution chips as warning severity", () => {
    expect(getChip("smell_rotten")?.severity).toBe("warning");
    expect(getChip("surface_slime")?.severity).toBe("warning");
  });
});

describe("seed templates", () => {
  it("provides templates for all v1 ferment types", () => {
    for (const type of ["fpj", "ffj", "labs", "fish", "plant", "custom"] as const) {
      const template = getSeedTemplate(type);
      expect(template).toBeDefined();
      expect(template!.stages.length).toBeGreaterThan(0);
      expect(template!.stages[0].expectationText.length).toBeGreaterThan(0);
    }
  });
});
