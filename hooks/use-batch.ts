"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import type { BatchPatchInput } from "@/lib/api/schemas";
import {
  patchBatchLocal,
  readLocalBatch,
  syncBatchesFromServer,
} from "@/offline/repository";

export function useBatch(id: string) {
  return useQuery({
    queryKey: queryKeys.batch(id),
    queryFn: async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          await syncBatchesFromServer();
        }
      } catch {
        // Fall back to local cache.
      }

      const batch = await readLocalBatch(id);
      if (!batch) {
        throw new Error("Batch not found");
      }

      return batch;
    },
    enabled: Boolean(id),
  });
}

export function useUpdateBatch(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Omit<BatchPatchInput, "updatedAt">) => {
      return patchBatchLocal(id, { ...patch, updatedAt: Date.now() });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.batch(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.batches() });
    },
  });
}
