"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import type { BatchUpsertInput } from "@/lib/api/schemas";
import { generateNextBatchCode, suggestBatchName } from "@/lib/codes";
import { newId } from "@/lib/id";
import { getSeedTemplate } from "@/lib/seed-data";
import type { FermentType } from "@/lib/schema";
import {
  readLocalBatches,
  saveBatchLocal,
  syncAllBatchesFromServer,
  syncBatchesFromServer,
} from "@/offline/repository";

export function useBatches() {
  return useQuery({
    queryKey: queryKeys.batches({ excludeArchived: true }),
    queryFn: async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          await syncBatchesFromServer();
        }
      } catch {
        // Fall back to local cache when offline or API unavailable.
      }

      return readLocalBatches();
    },
  });
}

/** All batches including archived — backs the History (finished/archived) view. */
export function useAllBatches() {
  return useQuery({
    queryKey: queryKeys.allBatches(),
    queryFn: async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          await syncAllBatchesFromServer();
        }
      } catch {
        // Fall back to local cache when offline or API unavailable.
      }

      return readLocalBatches();
    },
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      type: FermentType;
      name?: string;
      code?: string;
      sizeValue?: number | null;
      sizeUnit?: string | null;
    }) => {
      const template = getSeedTemplate(input.type);
      if (!template) {
        throw new Error(`Unknown ferment type: ${input.type}`);
      }

      const existing = await readLocalBatches();
      const existingCodes = existing
        .filter((batch) => batch.type === input.type)
        .map((batch) => batch.code);
      const now = Date.now();

      const batch: BatchUpsertInput = {
        id: newId(),
        code:
          input.code?.trim() ||
          generateNextBatchCode(input.type, existingCodes),
        name: input.name?.trim() || suggestBatchName(input.type),
        category: "fertilizer",
        type: input.type,
        templateId: template.id,
        sizeValue: input.sizeValue ?? null,
        sizeUnit: input.sizeUnit ?? template.defaultUnit,
        status: "active",
        health: "on_track",
        startedAt: now,
        finishedAt: null,
        currentStageIndex: 0,
        thumbnailPhotoId: null,
        createdAt: now,
        updatedAt: now,
      };

      return saveBatchLocal(batch);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.batches() });
    },
  });
}
