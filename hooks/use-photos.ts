"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { presignPhotoApi } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { PhotoUpsertInput } from "@/lib/api/schemas";
import { newId } from "@/lib/id";
import { imageExtFromFile, publicPhotoUrl } from "@/lib/photo-url";
import {
  patchBatchLocal,
  readLocalPhoto,
  readLocalPhotosForBatch,
  readLocalPhotosForObservation,
  readPhotoBlob,
  savePhotoBlobLocal,
  savePhotoLocal,
  syncPhotosFromServer,
} from "@/offline/repository";

async function imageSize(
  blob: Blob,
): Promise<{ width: number; height: number } | null> {
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close?.();
      return size;
    }
  } catch {
    // Dimensions are best-effort; the column is nullable.
  }
  return null;
}

/** Upload the captured blob to R2 via a presigned PUT. Returns true on success. */
async function uploadToR2(photoId: string, ext: string, blob: Blob) {
  const { uploadUrl } = await presignPhotoApi({ photoId, ext });
  const response = await fetch(uploadUrl, { method: "PUT", body: blob });
  if (!response.ok) {
    throw new Error(`R2 upload failed (${response.status})`);
  }
}

/**
 * Capture a photo into the offline store, set it as the batch cover, and
 * upload to R2 (best-effort, retried by the sync layer when offline). Plain
 * async so it can run imperatively outside React Query — e.g. in the New Batch
 * wizard, where the photo is attached right after the batch is created.
 */
export async function capturePhotoForBatch(
  batchId: string,
  file: File,
  observationId: string | null = null,
): Promise<PhotoUpsertInput> {
  const photoId = newId();
  const ext = imageExtFromFile(file);
  const r2Key = `photos/${photoId}.${ext}`;
  const now = Date.now();

  // Store the blob locally first so thumbnails render instantly and the
  // upload can be retried offline (Phase 8.3).
  await savePhotoBlobLocal(photoId, file);
  const size = await imageSize(file);

  const photo: PhotoUpsertInput = {
    id: photoId,
    batchId,
    observationId,
    r2Key,
    width: size?.width ?? null,
    height: size?.height ?? null,
    takenAt: now,
    uploadStatus: "pending",
    createdAt: now,
  };
  await savePhotoLocal(photo);

  // Optimistically make this the batch cover.
  try {
    await patchBatchLocal(batchId, {
      thumbnailPhotoId: photoId,
      updatedAt: now,
    });
  } catch {
    // Batch may not exist locally yet; cover is non-critical.
  }

  // Online happy path: upload now and mark done. On failure we leave it
  // pending for the reconnect flush rather than blocking capture.
  if (typeof navigator === "undefined" || navigator.onLine) {
    try {
      await uploadToR2(photoId, ext, file);
      await savePhotoLocal({ ...photo, uploadStatus: "done" });
    } catch {
      // Stay pending; sync layer retries later.
    }
  }

  return photo;
}

export function useCapturePhoto(batchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { file: File; observationId?: string | null }) =>
      capturePhotoForBatch(batchId, input.file, input.observationId ?? null),
    onSuccess: (photo) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.photo(photo.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.batch(batchId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.batches() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.batchPhotos(batchId),
      });
      if (photo.observationId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.observationPhotos(photo.observationId),
        });
      }
    },
  });
}

/**
 * Resolve a displayable image src for a photo id: prefers the locally stored
 * blob (single-device first), falling back to the R2 public URL.
 */
export function usePhotoSrc(photoId: string | null | undefined) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: queryKeys.photo(photoId ?? "none"),
    enabled: Boolean(photoId),
    queryFn: async () => {
      const [blob, photo] = await Promise.all([
        readPhotoBlob(photoId!),
        readLocalPhoto(photoId!),
      ]);
      return {
        blob,
        r2Key: photo?.r2Key ?? null,
        publicUrl: photo?.publicUrl ?? null,
      };
    },
  });

  useEffect(() => {
    if (data?.blob) {
      const url = URL.createObjectURL(data.blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [data?.blob]);

  if (objectUrl) {
    return objectUrl;
  }
  // Prefer the URL the server resolved (works even when the browser build has
  // no NEXT_PUBLIC_R2_PUBLIC_BASE_URL); fall back to building it client-side.
  if (data?.publicUrl) {
    return data.publicUrl;
  }
  if (data?.r2Key) {
    return publicPhotoUrl(data.r2Key);
  }
  return null;
}

export function useObservationPhotos(observationId: string) {
  return useQuery({
    queryKey: queryKeys.observationPhotos(observationId),
    enabled: Boolean(observationId),
    queryFn: () => readLocalPhotosForObservation(observationId),
  });
}

/**
 * Every photo for a batch (cover + all observations'), synced from the server so
 * images captured on another device show up here. Pulls remote rows into the
 * local cache, then returns the merged set; on a successful sync it nudges the
 * per-photo `usePhotoSrc` queries so freshly-hydrated R2 keys render right away.
 */
export function useBatchPhotos(batchId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.batchPhotos(batchId),
    enabled: Boolean(batchId),
    queryFn: async () => {
      let synced = false;
      try {
        if (typeof navigator === "undefined" || navigator.onLine) {
          await syncPhotosFromServer(batchId);
          synced = true;
        }
      } catch {
        // Offline or server error: fall back to the local cache.
      }

      const photos = await readLocalPhotosForBatch(batchId);

      if (synced) {
        for (const photo of photos) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.photo(photo.id),
          });
        }
      }

      return photos;
    },
  });
}
