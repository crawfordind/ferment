import { eq } from "drizzle-orm";

import type { PhotoUpsertInput } from "@/lib/api/schemas";
import type { Database } from "@/lib/db";
import { getBatchById } from "@/lib/services/batches";
import { batches, photos } from "@/lib/schema";

export async function upsertPhoto(db: Database, input: PhotoUpsertInput) {
  await getBatchById(db, input.batchId);

  await db
    .insert(photos)
    .values({
      id: input.id,
      batchId: input.batchId,
      observationId: input.observationId ?? null,
      r2Key: input.r2Key,
      width: input.width ?? null,
      height: input.height ?? null,
      takenAt: input.takenAt,
      uploadStatus: input.uploadStatus,
      createdAt: input.createdAt,
    })
    .onConflictDoUpdate({
      target: photos.id,
      set: {
        batchId: input.batchId,
        observationId: input.observationId ?? null,
        r2Key: input.r2Key,
        width: input.width ?? null,
        height: input.height ?? null,
        takenAt: input.takenAt,
        uploadStatus: input.uploadStatus,
      },
    });

  if (input.uploadStatus === "done") {
    await db
      .update(batches)
      .set({ thumbnailPhotoId: input.id })
      .where(eq(batches.id, input.batchId));
  }

  const [photo] = await db
    .select()
    .from(photos)
    .where(eq(photos.id, input.id))
    .limit(1);

  return photo;
}
