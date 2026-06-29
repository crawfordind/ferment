"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import type { ObservationUpsertInput } from "@/lib/api/schemas";
import { newId } from "@/lib/id";
import { getSeedTemplate } from "@/lib/seed-data";
import { computeHealth } from "@/lib/status";
import {
  patchBatchLocal,
  readLocalBatch,
  readLocalObservations,
  saveObservationLocal,
  syncObservationsFromServer,
} from "@/offline/repository";

export function useObservations(batchId: string) {
  return useQuery({
    queryKey: queryKeys.observations(batchId),
    queryFn: async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          await syncObservationsFromServer(batchId);
        }
      } catch {
        // Fall back to local cache.
      }

      return readLocalObservations(batchId);
    },
    enabled: Boolean(batchId),
  });
}

export function useCreateObservation(batchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      note?: string | null;
      chipKeys?: string[];
      transcriptStatus?: ObservationUpsertInput["transcriptStatus"];
      voiceTranscript?: string | null;
      voiceAudioKey?: string | null;
      ph?: number | null;
      brix?: number | null;
      tempC?: number | null;
    }) => {
      const batch = await readLocalBatch(batchId);
      if (!batch) {
        throw new Error("Batch not found");
      }

      const now = Date.now();
      const observation: ObservationUpsertInput = {
        id: input.id ?? newId(),
        batchId,
        observedAt: now,
        note: input.note ?? null,
        voiceAudioKey: input.voiceAudioKey ?? null,
        voiceTranscript: input.voiceTranscript ?? null,
        transcriptStatus: input.transcriptStatus ?? "none",
        ph: input.ph ?? null,
        brix: input.brix ?? null,
        tempC: input.tempC ?? null,
        chipKeys: input.chipKeys ?? [],
        createdAt: now,
        updatedAt: now,
      };

      await saveObservationLocal(observation);

      // Recompute and persist health from this latest observation + stage timing.
      const template = getSeedTemplate(batch.type);
      if (template) {
        const health = computeHealth(
          batch,
          { chipKeys: observation.chipKeys, ph: observation.ph },
          template,
        );
        if (health !== batch.health) {
          await patchBatchLocal(batchId, { health, updatedAt: Date.now() });
        }
      }

      return observation;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.observations(batchId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.batch(batchId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.batches() });
    },
  });
}
