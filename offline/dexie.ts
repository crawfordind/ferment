import Dexie, { type EntityTable } from "dexie";

import type {
  BatchUpsertInput,
  ObservationUpsertInput,
  PhotoDto,
  PhotoUpsertInput,
} from "@/lib/api/schemas";

export type OutboxKind = "batch" | "observation" | "photo" | "transcript";
export type OutboxStatus = "pending" | "processing" | "done" | "failed";

// These alias the API DTOs, so added non-indexed fields (recipe inputs, yield,
// cost on batches; pH/Brix/temp on observations) flow through with no Dexie
// version bump — `.stores()` only declares indexes, not the full record shape.
export type LocalBatch = BatchUpsertInput;
export type LocalObservation = ObservationUpsertInput;
// Carries the server-resolved `publicUrl` (non-indexed) so a photo captured on
// another device renders here without the browser needing the R2 base URL.
export type LocalPhoto = PhotoDto;

/** Captured image bytes held locally for instant thumbnails and offline upload. */
export type LocalPhotoBlob = {
  id: string;
  blob: Blob;
};

/** Recorded audio bytes held locally (keyed by observation id) for offline upload + transcription. */
export type LocalAudioBlob = {
  id: string;
  blob: Blob;
};

export type OutboxEntry = {
  id: string;
  kind: OutboxKind;
  entityId: string;
  payload: BatchUpsertInput | ObservationUpsertInput | PhotoUpsertInput;
  attempts: number;
  status: OutboxStatus;
  createdAt: number;
  updatedAt: number;
};

export class FermentDb extends Dexie {
  batches!: EntityTable<LocalBatch, "id">;
  observations!: EntityTable<LocalObservation, "id">;
  photos!: EntityTable<LocalPhoto, "id">;
  photoBlobs!: EntityTable<LocalPhotoBlob, "id">;
  audioBlobs!: EntityTable<LocalAudioBlob, "id">;
  outbox!: EntityTable<OutboxEntry, "id">;

  constructor() {
    super("ferment-tracker");

    this.version(1).stores({
      batches: "id, code, status, updatedAt",
      observations: "id, batchId, observedAt, updatedAt",
      photos: "id, batchId, observationId, createdAt",
      outbox: "id, kind, entityId, status, createdAt",
    });

    this.version(2).stores({
      batches: "id, code, status, updatedAt",
      observations: "id, batchId, observedAt, updatedAt",
      photos: "id, batchId, observationId, createdAt",
      photoBlobs: "id",
      outbox: "id, kind, entityId, status, createdAt",
    });

    this.version(3).stores({
      batches: "id, code, status, updatedAt",
      observations: "id, batchId, observedAt, updatedAt",
      photos: "id, batchId, observationId, createdAt",
      photoBlobs: "id",
      audioBlobs: "id",
      outbox: "id, kind, entityId, status, createdAt",
    });
  }
}

let dbInstance: FermentDb | null = null;

export function getLocalDb() {
  if (typeof window === "undefined") {
    throw new Error("Local database is only available in the browser");
  }

  if (!dbInstance) {
    dbInstance = new FermentDb();
  }

  return dbInstance;
}

export function resetLocalDbForTests() {
  dbInstance = null;
}
