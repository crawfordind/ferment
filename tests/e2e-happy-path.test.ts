import { describe, expect, it } from "vitest";

import type { BatchUpsertInput } from "@/lib/api/schemas";
import { getBatchById, patchBatch, upsertBatch } from "@/lib/services/batches";
import {
  listObservationsForBatch,
  upsertObservation,
} from "@/lib/services/observations";
import { getSeedTemplate } from "@/lib/seed-data";
import { computeHealth } from "@/lib/status";
import { createTestDb } from "@/tests/helpers/test-db";

const DAY = 24 * 60 * 60 * 1000;

/**
 * End-to-end happy path through the data + domain layers, mirroring the field
 * loop verified in the live app: create a batch → log an observation with a
 * spoilage chip + note → recompute and persist health → read the timeline back
 * → finish the batch.
 */
describe("e2e: create → log → status → finish", () => {
  it("runs the full field-logging loop end to end", async () => {
    const db = await createTestDb();
    const template = getSeedTemplate("fpj");
    if (!template) throw new Error("seed template missing");

    const startedAt = Date.UTC(2026, 0, 1);

    // 1. Create a batch.
    const batchInput: BatchUpsertInput = {
      id: "e2e-batch-1",
      code: "FPJ-01",
      name: "Plant FPJ",
      category: "fertilizer",
      type: "fpj",
      templateId: "tpl-fpj",
      sizeValue: 2,
      sizeUnit: "kg",
      status: "active",
      health: "on_track",
      startedAt,
      finishedAt: null,
      currentStageIndex: 0,
      thumbnailPhotoId: null,
      createdAt: startedAt,
      updatedAt: startedAt,
    };
    await upsertBatch(db, batchInput);

    const created = await getBatchById(db, batchInput.id);
    expect(created.status).toBe("active");
    expect(created.health).toBe("on_track");

    // 2. Log an observation with a spoilage warning chip and a note.
    const observedAt = startedAt + DAY; // day 1, still in the Soak stage
    const observation = await upsertObservation(db, {
      id: "e2e-obs-1",
      batchId: batchInput.id,
      observedAt,
      note: "white fuzzy patches forming on top",
      voiceAudioKey: null,
      voiceTranscript: null,
      transcriptStatus: "none",
      chipKeys: ["surface_fuzzy_mold"],
      createdAt: observedAt,
      updatedAt: observedAt,
    });
    expect(observation.chipKeys).toContain("surface_fuzzy_mold");
    expect(observation.dayInProcess).toBe(1);

    // 3. Recompute health from the latest observation and persist it.
    const health = computeHealth(
      { startedAt },
      { chipKeys: observation.chipKeys },
      template,
      observedAt,
    );
    expect(health).toBe("needs_action");

    await patchBatch(db, batchInput.id, {
      health,
      updatedAt: observedAt,
    });
    expect((await getBatchById(db, batchInput.id)).health).toBe("needs_action");

    // 4. The timeline reads the observation back.
    const timeline = await listObservationsForBatch(db, batchInput.id);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].id).toBe("e2e-obs-1");
    expect(timeline[0].note).toBe("white fuzzy patches forming on top");
    expect(timeline[0].chipKeys).toEqual(["surface_fuzzy_mold"]);

    // 5. Finish the batch.
    const finishedAt = startedAt + 7 * DAY;
    await patchBatch(db, batchInput.id, {
      status: "finished",
      finishedAt,
      updatedAt: finishedAt,
    });

    const finished = await getBatchById(db, batchInput.id);
    expect(finished.status).toBe("finished");
    expect(finished.finishedAt).toBe(finishedAt);
    // Health persists through the lifecycle change.
    expect(finished.health).toBe("needs_action");
  });
});
