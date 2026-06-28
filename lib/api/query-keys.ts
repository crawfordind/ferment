export const queryKeys = {
  batches: (filters?: { status?: string; excludeArchived?: boolean }) =>
    ["batches", filters ?? {}] as const,
  batch: (id: string) => ["batch", id] as const,
  observations: (batchId: string) => ["observations", batchId] as const,
  photo: (id: string) => ["photo", id] as const,
  observationPhotos: (observationId: string) =>
    ["observation-photos", observationId] as const,
};
