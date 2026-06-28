import { describe, expect, it } from "vitest";

import {
  formatBatchCode,
  generateNextBatchCode,
  parseBatchCodeNumber,
  suggestBatchName,
} from "@/lib/codes";

describe("generateNextBatchCode", () => {
  it("returns first code when none exist", () => {
    expect(generateNextBatchCode("fpj", [])).toBe("FPJ-01");
  });

  it("increments from the highest existing code", () => {
    expect(generateNextBatchCode("fpj", ["FPJ-01", "FPJ-03"])).toBe("FPJ-04");
  });

  it("fills gaps by using max + 1, not first gap", () => {
    expect(generateNextBatchCode("ffj", ["FFJ-01", "FFJ-05"])).toBe("FFJ-06");
  });

  it("zero-pads sequence numbers", () => {
    expect(formatBatchCode("labs", 9)).toBe("LABS-09");
    expect(formatBatchCode("labs", 10)).toBe("LABS-10");
  });

  it("ignores codes from other types", () => {
    expect(generateNextBatchCode("fish", ["FPJ-99", "FISH-02"])).toBe(
      "FISH-03",
    );
  });

  it("handles collision by advancing past existing", () => {
    const existing = ["FPJ-01", "FPJ-02", "FPJ-03"];
    const next = generateNextBatchCode("fpj", existing);
    expect(existing).not.toContain(next);
    expect(next).toBe("FPJ-04");
  });
});

describe("parseBatchCodeNumber", () => {
  it("parses valid codes", () => {
    expect(parseBatchCodeNumber("FPJ-03", "FPJ")).toBe(3);
  });

  it("returns null for invalid codes", () => {
    expect(parseBatchCodeNumber("FPJ-3", "FPJ")).toBeNull();
    expect(parseBatchCodeNumber("FFJ-03", "FPJ")).toBeNull();
  });
});

describe("suggestBatchName", () => {
  it("returns default name without material", () => {
    expect(suggestBatchName("fpj")).toBe("Plant FPJ");
  });

  it("combines material with type prefix", () => {
    expect(suggestBatchName("fpj", "Nettle")).toBe("Nettle FPJ");
  });
});
