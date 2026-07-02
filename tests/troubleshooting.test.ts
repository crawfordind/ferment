import { describe, expect, it } from "vitest";

import {
  getChipGuidance,
  getGuidanceForChips,
} from "@/lib/troubleshooting";

describe("getChipGuidance", () => {
  it("returns warning guidance for spoilage signs", () => {
    const g = getChipGuidance("surface_fuzzy_mold");
    expect(g?.tone).toBe("warning");
    expect(g?.whatToDo).toMatch(/skim|discard|sugar/i);
  });

  it("reassures on a healthy white film", () => {
    expect(getChipGuidance("surface_white_film")?.tone).toBe("reassure");
  });

  it("applies a per-type override (ammonia is normal in fish ferments)", () => {
    expect(getChipGuidance("smell_ammonia")?.tone).toBe("warning");
    expect(getChipGuidance("smell_ammonia", "fish")?.tone).toBe("reassure");
  });

  it("returns undefined for chips with no guidance", () => {
    expect(getChipGuidance("smell_sweet")).toBeUndefined();
  });
});

describe("getGuidanceForChips", () => {
  it("orders warnings before reassurances", () => {
    const result = getGuidanceForChips([
      "surface_white_film",
      "surface_slime",
    ]);
    expect(result.map((r) => r.chipKey)).toEqual([
      "surface_slime",
      "surface_white_film",
    ]);
  });

  it("skips chips without guidance and de-dupes", () => {
    const result = getGuidanceForChips([
      "smell_sweet",
      "smell_rotten",
      "smell_rotten",
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].chipKey).toBe("smell_rotten");
  });

  it("ignores unknown chip keys", () => {
    expect(getGuidanceForChips(["not_a_real_chip"])).toEqual([]);
  });

  it("honors the ferment type for overrides", () => {
    const result = getGuidanceForChips(["smell_ammonia"], "fish");
    expect(result[0].tone).toBe("reassure");
  });
});
