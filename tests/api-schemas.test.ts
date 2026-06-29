import { describe, expect, it } from "vitest";

import {
  batchUpsertSchema,
  observationUpsertSchema,
  photoPresignRequestSchema,
} from "@/lib/api/schemas";

describe("batchUpsertSchema", () => {
  it("accepts a valid batch payload", () => {
    const parsed = batchUpsertSchema.parse({
      id: "batch-1",
      code: "FPJ-01",
      name: "Nettle FPJ",
      category: "fertilizer",
      type: "fpj",
      templateId: "tpl-fpj",
      status: "active",
      health: "on_track",
      startedAt: 1,
      currentStageIndex: 0,
      createdAt: 1,
      updatedAt: 1,
    });

    expect(parsed.code).toBe("FPJ-01");
  });

  it("rejects missing required fields", () => {
    expect(() =>
      batchUpsertSchema.parse({
        id: "batch-1",
        code: "FPJ-01",
      }),
    ).toThrow();
  });

  it("accepts recipe, yield, cost, and lot fields", () => {
    const parsed = batchUpsertSchema.parse({
      id: "batch-1",
      code: "FOOD-01",
      name: "Sauerkraut",
      category: "food",
      type: "food",
      templateId: "tpl-food",
      status: "finished",
      health: "on_track",
      startedAt: 1,
      currentStageIndex: 0,
      inputs: '[{"name":"Cabbage","quantity":1,"unit":"kg"}]',
      yieldValue: 0.8,
      yieldUnit: "L",
      costAmount: 4.5,
      lotId: "FOOD-01-20260628",
      createdAt: 1,
      updatedAt: 1,
    });

    expect(parsed.yieldValue).toBe(0.8);
    expect(parsed.lotId).toBe("FOOD-01-20260628");
  });
});

describe("observationUpsertSchema", () => {
  it("defaults chipKeys to an empty array", () => {
    const parsed = observationUpsertSchema.parse({
      id: "obs-1",
      batchId: "batch-1",
      observedAt: 1,
      transcriptStatus: "none",
      createdAt: 1,
      updatedAt: 1,
    });

    expect(parsed.chipKeys).toEqual([]);
  });

  it("accepts numeric pH/Brix/temperature readings", () => {
    const parsed = observationUpsertSchema.parse({
      id: "obs-1",
      batchId: "batch-1",
      observedAt: 1,
      transcriptStatus: "none",
      ph: 3.8,
      brix: 6,
      tempC: 21.5,
      createdAt: 1,
      updatedAt: 1,
    });

    expect(parsed.ph).toBe(3.8);
    expect(parsed.tempC).toBe(21.5);
  });
});

describe("photoPresignRequestSchema", () => {
  it("defaults ext to jpg", () => {
    const parsed = photoPresignRequestSchema.parse({ photoId: "photo-1" });
    expect(parsed.ext).toBe("jpg");
  });

  it("accepts alphanumeric extensions", () => {
    const parsed = photoPresignRequestSchema.parse({
      photoId: "photo-1",
      ext: "webp",
    });
    expect(parsed.ext).toBe("webp");
  });

  it("rejects extensions with unsafe characters", () => {
    expect(() =>
      photoPresignRequestSchema.parse({ photoId: "photo-1", ext: "../x" }),
    ).toThrow();
  });
});
