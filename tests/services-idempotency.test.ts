import { describe, expect, it } from "vitest";

import type { BatchUpsertInput } from "@/lib/api/schemas";
import { SEED_USER_ID } from "@/lib/auth-constants";
import { upsertBatch } from "@/lib/services/batches";
import { upsertObservation } from "@/lib/services/observations";
import { createTestDb } from "@/tests/helpers/test-db";

const baseBatch: BatchUpsertInput = {
  id: "batch-test-1",
  code: "FPJ-01",
  name: "Test FPJ",
  category: "fertilizer",
  type: "fpj",
  templateId: "tpl-fpj",
  sizeValue: 1,
  sizeUnit: "kg",
  status: "active",
  health: "on_track",
  startedAt: Date.UTC(2026, 0, 1),
  finishedAt: null,
  currentStageIndex: 0,
  thumbnailPhotoId: null,
  createdAt: 1,
  updatedAt: 1,
};

describe("service idempotency", () => {
  it("upserting the same batch twice is a no-op", async () => {
    const db = await createTestDb();

    const first = await upsertBatch(db, SEED_USER_ID, baseBatch);
    const second = await upsertBatch(db, SEED_USER_ID, baseBatch);

    expect(second).toEqual(first);
    expect(second.updatedAt).toBe(first.updatedAt);
  });

  it("upserting the same observation twice replaces chips identically", async () => {
    const db = await createTestDb();
    await upsertBatch(db, SEED_USER_ID, baseBatch);

    const observationInput = {
      id: "obs-test-1",
      batchId: baseBatch.id,
      observedAt: Date.UTC(2026, 0, 3),
      note: "Smells sour",
      voiceAudioKey: null,
      voiceTranscript: null,
      transcriptStatus: "none" as const,
      chipKeys: ["smell_sour", "activity_calm"],
      createdAt: 2,
      updatedAt: 2,
    };

    const first = await upsertObservation(db, SEED_USER_ID, observationInput);
    const second = await upsertObservation(db, SEED_USER_ID, observationInput);

    expect(second.chipKeys).toEqual(first.chipKeys);
    expect(second.dayInProcess).toBe(2);
    expect(second.note).toBe("Smells sour");
  });
});
