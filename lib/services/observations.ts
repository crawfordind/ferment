import { desc, eq } from "drizzle-orm";

import type { ObservationUpsertInput } from "@/lib/api/schemas";
import { computeDayInProcess } from "@/lib/day";
import type { Database } from "@/lib/db";
import { getBatchById } from "@/lib/services/batches";
import { observationChips, observations } from "@/lib/schema";

async function attachChips(
  db: Database,
  observationId: string,
  chipKeys: string[],
) {
  await db
    .delete(observationChips)
    .where(eq(observationChips.observationId, observationId));

  if (chipKeys.length === 0) {
    return;
  }

  await db.insert(observationChips).values(
    chipKeys.map((chipKey) => ({
      observationId,
      chipKey,
    })),
  );
}

export async function upsertObservation(
  db: Database,
  input: ObservationUpsertInput,
) {
  const batch = await getBatchById(db, input.batchId);
  const dayInProcess = computeDayInProcess(batch.startedAt, input.observedAt);

  await db
    .insert(observations)
    .values({
      id: input.id,
      batchId: input.batchId,
      observedAt: input.observedAt,
      dayInProcess,
      note: input.note ?? null,
      voiceAudioKey: input.voiceAudioKey ?? null,
      voiceTranscript: input.voiceTranscript ?? null,
      transcriptStatus: input.transcriptStatus,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    })
    .onConflictDoUpdate({
      target: observations.id,
      set: {
        batchId: input.batchId,
        observedAt: input.observedAt,
        dayInProcess,
        note: input.note ?? null,
        voiceAudioKey: input.voiceAudioKey ?? null,
        voiceTranscript: input.voiceTranscript ?? null,
        transcriptStatus: input.transcriptStatus,
        updatedAt: input.updatedAt,
      },
    });

  await attachChips(db, input.id, input.chipKeys);

  const [observation] = await db
    .select()
    .from(observations)
    .where(eq(observations.id, input.id))
    .limit(1);

  const chips = await db
    .select({ chipKey: observationChips.chipKey })
    .from(observationChips)
    .where(eq(observationChips.observationId, input.id));

  return {
    ...observation,
    chipKeys: chips.map((chip) => chip.chipKey),
  };
}

export async function listObservationsForBatch(db: Database, batchId: string) {
  await getBatchById(db, batchId);

  const rows = await db
    .select()
    .from(observations)
    .where(eq(observations.batchId, batchId))
    .orderBy(desc(observations.observedAt));

  const result = [];

  for (const observation of rows) {
    const chips = await db
      .select({ chipKey: observationChips.chipKey })
      .from(observationChips)
      .where(eq(observationChips.observationId, observation.id));

    result.push({
      ...observation,
      chipKeys: chips.map((chip) => chip.chipKey),
    });
  }

  return result;
}
