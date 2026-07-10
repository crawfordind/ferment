import { describe, expect, it } from "vitest";

import type { BatchUpsertInput, PhotoUpsertInput } from "@/lib/api/schemas";
import { SEED_USER_ID } from "@/lib/auth-constants";
import { upsertBatch } from "@/lib/services/batches";
import { upsertObservation } from "@/lib/services/observations";
import { listPhotosForBatch, upsertPhoto } from "@/lib/services/photos";
import { createTestDb } from "@/tests/helpers/test-db";

const baseBatch: BatchUpsertInput = {
  id: "batch-photos-1",
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

function photo(overrides: Partial<PhotoUpsertInput>): PhotoUpsertInput {
  return {
    id: "photo-x",
    batchId: baseBatch.id,
    observationId: null,
    r2Key: "photos/photo-x.jpg",
    width: null,
    height: null,
    takenAt: 1,
    uploadStatus: "done",
    createdAt: 1,
    ...overrides,
  };
}

describe("listPhotosForBatch", () => {
  it("returns the cover photo and every observation's photos, oldest first", async () => {
    const db = await createTestDb();
    await upsertBatch(db, SEED_USER_ID, baseBatch);
    await upsertObservation(db, SEED_USER_ID, {
      id: "obs-1",
      batchId: baseBatch.id,
      observedAt: Date.UTC(2026, 0, 2),
      note: null,
      voiceAudioKey: null,
      voiceTranscript: null,
      transcriptStatus: "none",
      chipKeys: [],
      createdAt: 2,
      updatedAt: 2,
    });

    // Insert out of creation order to prove the query sorts.
    await upsertPhoto(
      db,
      SEED_USER_ID,
      photo({ id: "p-obs", observationId: "obs-1", createdAt: 20 }),
    );
    await upsertPhoto(
      db,
      SEED_USER_ID,
      photo({ id: "p-cover", observationId: null, createdAt: 10 }),
    );

    const photos = await listPhotosForBatch(db, SEED_USER_ID, baseBatch.id);

    expect(photos.map((p) => p.id)).toEqual(["p-cover", "p-obs"]);
    expect(photos[0].observationId).toBeNull();
    expect(photos[1].observationId).toBe("obs-1");
  });

  it("throws when the batch does not exist", async () => {
    const db = await createTestDb();
    await expect(
      listPhotosForBatch(db, SEED_USER_ID, "missing"),
    ).rejects.toThrow();
  });
});
