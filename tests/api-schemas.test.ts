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
