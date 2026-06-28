import { presignPhotoApi, transcribeAudioApi } from "@/lib/api/client";
import { getLocalDb } from "@/offline/dexie";
import {
  readAudioBlob,
  readPhotoBlob,
  saveObservationLocal,
  savePhotoLocal,
} from "@/offline/repository";

function extFromKey(key: string | null | undefined, fallback: string): string {
  const ext = key?.split(".").pop();
  return ext && /^[a-z0-9]+$/i.test(ext) ? ext : fallback;
}

let mediaFlushInFlight: Promise<{ changed: boolean }> | null = null;

/**
 * Completes media that was captured offline (or whose upload/transcription
 * failed): uploads pending photo blobs to R2, and uploads + transcribes pending
 * voice notes. Concurrent calls are coalesced so it never floods the network.
 */
export async function flushPendingMedia(): Promise<{ changed: boolean }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { changed: false };
  }
  if (mediaFlushInFlight) {
    return mediaFlushInFlight;
  }
  mediaFlushInFlight = runMediaFlush();
  try {
    return await mediaFlushInFlight;
  } finally {
    mediaFlushInFlight = null;
  }
}

async function runMediaFlush(): Promise<{ changed: boolean }> {
  const db = getLocalDb();
  let changed = false;

  // 1. Pending photo uploads.
  const photos = await db.photos.toArray();
  for (const photo of photos.filter((p) => p.uploadStatus === "pending")) {
    const blob = await readPhotoBlob(photo.id);
    if (!blob) continue;
    try {
      const ext = extFromKey(photo.r2Key, "jpg");
      const { uploadUrl } = await presignPhotoApi({
        photoId: photo.id,
        ext,
        prefix: "photos",
      });
      const res = await fetch(uploadUrl, { method: "PUT", body: blob });
      if (!res.ok) throw new Error(`upload ${res.status}`);
      await savePhotoLocal({ ...photo, uploadStatus: "done" });
      changed = true;
    } catch {
      // Leave pending; retried on the next pass.
    }
  }

  // 2. Pending voice transcriptions (and their audio upload).
  const observations = await db.observations.toArray();
  for (const obs of observations.filter((o) => o.transcriptStatus === "pending")) {
    const blob = await readAudioBlob(obs.id);
    if (!blob) continue;
    const format = extFromKey(obs.voiceAudioKey, "webm");
    try {
      if (obs.voiceAudioKey) {
        try {
          const { uploadUrl } = await presignPhotoApi({
            photoId: obs.id,
            ext: format,
            prefix: "audio",
          });
          await fetch(uploadUrl, { method: "PUT", body: blob });
        } catch {
          // Audio upload is best-effort; transcript is the key artifact.
        }
      }
      const transcript = await transcribeAudioApi(blob, format);
      await saveObservationLocal({
        ...obs,
        voiceTranscript: transcript,
        transcriptStatus: "done",
        updatedAt: Date.now(),
      });
      changed = true;
    } catch {
      // Leave pending; retried on the next pass.
    }
  }

  return { changed };
}
