import type {
  BatchDto,
  BatchPatchInput,
  BatchUpsertInput,
  ObservationDto,
  ObservationUpsertInput,
  PhotoDto,
  PhotoPresignResponse,
  PhotoUpsertInput,
} from "@/lib/api/schemas";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string; details?: unknown };

  if (!response.ok) {
    throw new ApiClientError(
      payload.error ?? "Request failed",
      response.status,
      payload.details,
    );
  }

  return payload;
}

export async function fetchBatches(options?: {
  status?: string;
  excludeArchived?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.status) {
    params.set("status", options.status);
  }
  if (options?.excludeArchived) {
    params.set("excludeArchived", "true");
  }

  const query = params.toString();
  const response = await fetch(`/api/batches${query ? `?${query}` : ""}`);
  const data = await parseResponse<{ batches: BatchDto[] }>(response);
  return data.batches;
}

export async function fetchBatch(id: string) {
  const response = await fetch(`/api/batches/${id}`);
  const data = await parseResponse<{ batch: BatchDto }>(response);
  return data.batch;
}

export async function upsertBatchApi(input: BatchUpsertInput) {
  const response = await fetch("/api/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseResponse<{ batch: BatchDto }>(response);
  return data.batch;
}

export async function patchBatchApi(id: string, input: BatchPatchInput) {
  const response = await fetch(`/api/batches/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseResponse<{ batch: BatchDto }>(response);
  return data.batch;
}

export async function fetchPhotos(batchId: string) {
  const response = await fetch(`/api/batches/${batchId}/photos`);
  const data = await parseResponse<{ photos: PhotoDto[] }>(response);
  return data.photos;
}

export async function fetchObservations(batchId: string) {
  const response = await fetch(`/api/batches/${batchId}/observations`);
  const data = await parseResponse<{ observations: ObservationDto[] }>(response);
  return data.observations;
}

export async function upsertObservationApi(
  batchId: string,
  input: ObservationUpsertInput,
) {
  const response = await fetch(`/api/batches/${batchId}/observations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseResponse<{ observation: ObservationDto }>(response);
  return data.observation;
}

export async function transcribeAudioApi(blob: Blob, format?: string) {
  const form = new FormData();
  form.append("file", blob, `audio.${format ?? "webm"}`);
  if (format) {
    form.append("format", format);
  }

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: form,
  });
  const data = await parseResponse<{ transcript: string }>(response);
  return data.transcript;
}

export async function presignPhotoApi(input: {
  photoId: string;
  ext?: string;
  prefix?: "photos" | "audio";
}) {
  const response = await fetch("/api/photos/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse<PhotoPresignResponse>(response);
}

export async function upsertPhotoApi(input: PhotoUpsertInput) {
  const response = await fetch("/api/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseResponse<{ photo: PhotoDto }>(response);
  return data.photo;
}
