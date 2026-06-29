import {
  patchBatchApi,
  upsertBatchApi,
  upsertObservationApi,
  upsertPhotoApi,
} from "@/lib/api/client";
import type {
  BatchPatchInput,
  BatchUpsertInput,
  ObservationUpsertInput,
  PhotoUpsertInput,
} from "@/lib/api/schemas";
import { newId } from "@/lib/id";
import {
  getLocalDb,
  type LocalBatch,
  type LocalObservation,
  type LocalPhoto,
  type OutboxEntry,
  type OutboxKind,
} from "@/offline/dexie";
import { getPendingOutboxEntries } from "@/offline/sync-order";

async function enqueueOutbox(
  kind: OutboxKind,
  entityId: string,
  payload: BatchUpsertInput | ObservationUpsertInput | PhotoUpsertInput,
) {
  const db = getLocalDb();
  const now = Date.now();
  const entry: OutboxEntry = {
    id: newId(),
    kind,
    entityId,
    payload,
    attempts: 0,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await db.outbox.put(entry);
  return entry;
}

async function flushEntry(entry: OutboxEntry) {
  const db = getLocalDb();

  await db.outbox.update(entry.id, {
    status: "processing",
    updatedAt: Date.now(),
  });

  try {
    switch (entry.kind) {
      case "batch":
        await upsertBatchApi(entry.payload as BatchUpsertInput);
        break;
      case "observation": {
        const payload = entry.payload as ObservationUpsertInput;
        await upsertObservationApi(payload.batchId, payload);
        break;
      }
      case "photo":
        await upsertPhotoApi(entry.payload as PhotoUpsertInput);
        break;
      case "transcript": {
        const payload = entry.payload as ObservationUpsertInput;
        await upsertObservationApi(payload.batchId, payload);
        break;
      }
    }

    await db.outbox.update(entry.id, {
      status: "done",
      updatedAt: Date.now(),
    });
  } catch (error) {
    await db.outbox.update(entry.id, {
      status: "failed",
      attempts: entry.attempts + 1,
      updatedAt: Date.now(),
    });
    throw error;
  }
}

let flushInFlight: Promise<{ flushed: number; pending: number }> | null = null;
let flushRequeued = false;

export async function flushOutbox(options?: { force?: boolean }) {
  if (
    typeof navigator !== "undefined" &&
    !navigator.onLine &&
    !options?.force
  ) {
    return { flushed: 0, pending: await countPendingOutbox() };
  }

  // Coalesce concurrent flushes so overlapping callers don't double-send. A
  // caller arriving mid-flush flags a re-run so entries it just enqueued get
  // drained in the same cycle instead of being stranded until the next trigger
  // (e.g. a batch create followed immediately by its photo + cover patch).
  if (flushInFlight) {
    flushRequeued = true;
    return flushInFlight;
  }

  flushInFlight = (async () => {
    const db = getLocalDb();
    let flushed = 0;

    do {
      flushRequeued = false;
      const pending = getPendingOutboxEntries(await db.outbox.toArray());
      for (const entry of pending) {
        try {
          await flushEntry(entry);
          flushed += 1;
        } catch {
          // Entry marked failed inside flushEntry; keep going with the rest.
        }
      }
    } while (flushRequeued);

    return { flushed, pending: await countPendingOutbox() };
  })();

  try {
    return await flushInFlight;
  } finally {
    flushInFlight = null;
  }
}

export async function countPendingOutbox() {
  const db = getLocalDb();
  const entries = await db.outbox.toArray();
  return getPendingOutboxEntries(entries).length;
}

/** Entity ids (batches/observations/photos) with un-synced outbox entries. */
export async function getPendingEntityIds() {
  const db = getLocalDb();
  const entries = await db.outbox.toArray();
  return new Set(
    getPendingOutboxEntries(entries).map((entry) => entry.entityId),
  );
}

export async function saveBatchLocal(input: LocalBatch) {
  const db = getLocalDb();
  await db.batches.put(input);
  await enqueueOutbox("batch", input.id, input);
  void flushOutbox();
  return input;
}

export async function patchBatchLocal(id: string, patch: BatchPatchInput) {
  const db = getLocalDb();
  const existing = await db.batches.get(id);

  if (!existing) {
    throw new Error("Batch not found locally");
  }

  const merged: LocalBatch = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  await db.batches.put(merged);
  await enqueueOutbox("batch", merged.id, merged);
  void flushOutbox();
  return merged;
}

export async function saveObservationLocal(input: LocalObservation) {
  const db = getLocalDb();
  await db.observations.put(input);
  await enqueueOutbox("observation", input.id, input);
  void flushOutbox();
  return input;
}

export async function savePhotoLocal(input: LocalPhoto) {
  const db = getLocalDb();
  await db.photos.put(input);
  await enqueueOutbox("photo", input.id, input);
  void flushOutbox();
  return input;
}

export async function savePhotoBlobLocal(id: string, blob: Blob) {
  const db = getLocalDb();
  await db.photoBlobs.put({ id, blob });
}

export async function readPhotoBlob(id: string) {
  const db = getLocalDb();
  const row = await db.photoBlobs.get(id);
  return row?.blob ?? null;
}

export async function saveAudioBlobLocal(id: string, blob: Blob) {
  const db = getLocalDb();
  await db.audioBlobs.put({ id, blob });
}

export async function readAudioBlob(id: string) {
  const db = getLocalDb();
  const row = await db.audioBlobs.get(id);
  return row?.blob ?? null;
}

export async function readLocalPhoto(id: string) {
  const db = getLocalDb();
  return db.photos.get(id);
}

export async function readLocalPhotosForObservation(observationId: string) {
  const db = getLocalDb();
  return db.photos
    .where("observationId")
    .equals(observationId)
    .sortBy("createdAt");
}

/**
 * Merge server rows into the local cache with last-write-wins by `updatedAt`,
 * so a server read-back never clobbers a newer un-flushed local write. Rows that
 * only exist locally (pending creates) are left untouched.
 */
export async function hydrateBatchesFromServer(batches: BatchUpsertInput[]) {
  const db = getLocalDb();
  for (const remote of batches) {
    const local = await db.batches.get(remote.id);
    if (!local || remote.updatedAt >= local.updatedAt) {
      await db.batches.put(remote);
    }
  }
}

export async function hydrateObservationsFromServer(
  observations: ObservationUpsertInput[],
) {
  const db = getLocalDb();
  for (const remote of observations) {
    const local = await db.observations.get(remote.id);
    if (!local || remote.updatedAt >= local.updatedAt) {
      await db.observations.put(remote);
    }
  }
}

export async function readLocalBatches() {
  const db = getLocalDb();
  return db.batches.orderBy("updatedAt").reverse().toArray();
}

export async function readLocalBatch(id: string) {
  const db = getLocalDb();
  return db.batches.get(id);
}

export async function readLocalObservations(batchId: string) {
  const db = getLocalDb();
  return db.observations
    .where("batchId")
    .equals(batchId)
    .sortBy("observedAt")
    .then((rows) => rows.reverse());
}

export async function syncBatchesFromServer() {
  const { fetchBatches } = await import("@/lib/api/client");
  const remote = await fetchBatches({ excludeArchived: true });
  await hydrateBatchesFromServer(remote);
  return remote;
}

/** Like syncBatchesFromServer, but includes archived batches (for History). */
export async function syncAllBatchesFromServer() {
  const { fetchBatches } = await import("@/lib/api/client");
  const remote = await fetchBatches();
  await hydrateBatchesFromServer(remote);
  return remote;
}

export async function syncObservationsFromServer(batchId: string) {
  const { fetchObservations } = await import("@/lib/api/client");
  const remote = await fetchObservations(batchId);
  await hydrateObservationsFromServer(
    remote.map((observation) => ({
      id: observation.id,
      batchId: observation.batchId,
      observedAt: observation.observedAt,
      note: observation.note,
      voiceAudioKey: observation.voiceAudioKey,
      voiceTranscript: observation.voiceTranscript,
      transcriptStatus: observation.transcriptStatus,
      ph: observation.ph,
      brix: observation.brix,
      tempC: observation.tempC,
      chipKeys: observation.chipKeys,
      createdAt: observation.createdAt,
      updatedAt: observation.updatedAt,
    })),
  );
  return remote;
}

export { patchBatchApi };
