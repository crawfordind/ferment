export const queryKeys = {
  batches: (filters?: { status?: string; excludeArchived?: boolean }) =>
    ["batches", filters ?? {}] as const,
  allBatches: () => ["batches", { scope: "all" }] as const,
  batch: (id: string) => ["batch", id] as const,
  observations: (batchId: string) => ["observations", batchId] as const,
  recentObservations: (sinceMs: number) => ["observations", "recent", sinceMs] as const,
  photo: (id: string) => ["photo", id] as const,
  batchPhotos: (batchId: string) => ["batch-photos", batchId] as const,
  observationPhotos: (observationId: string) =>
    ["observation-photos", observationId] as const,
};
