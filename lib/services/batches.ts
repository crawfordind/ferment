import { and, desc, eq, ne } from "drizzle-orm";

import type { BatchPatchInput, BatchUpsertInput } from "@/lib/api/schemas";
import { ApiError } from "@/lib/api/http";
import type { Database } from "@/lib/db";
import { batches } from "@/lib/schema";

function toBatchRow(input: BatchUpsertInput) {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    category: input.category,
    type: input.type,
    templateId: input.templateId,
    sizeValue: input.sizeValue ?? null,
    sizeUnit: input.sizeUnit ?? null,
    status: input.status,
    health: input.health,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt ?? null,
    currentStageIndex: input.currentStageIndex,
    thumbnailPhotoId: input.thumbnailPhotoId ?? null,
    inputs: input.inputs ?? null,
    yieldValue: input.yieldValue ?? null,
    yieldUnit: input.yieldUnit ?? null,
    costAmount: input.costAmount ?? null,
    lotId: input.lotId ?? null,
    coaUrl: input.coaUrl ?? null,
    sopVersion: input.sopVersion ?? null,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export async function upsertBatch(db: Database, input: BatchUpsertInput) {
  const row = toBatchRow(input);

  await db
    .insert(batches)
    .values(row)
    .onConflictDoUpdate({
      target: batches.id,
      set: {
        code: row.code,
        name: row.name,
        category: row.category,
        type: row.type,
        templateId: row.templateId,
        sizeValue: row.sizeValue,
        sizeUnit: row.sizeUnit,
        status: row.status,
        health: row.health,
        startedAt: row.startedAt,
        finishedAt: row.finishedAt,
        currentStageIndex: row.currentStageIndex,
        thumbnailPhotoId: row.thumbnailPhotoId,
        inputs: row.inputs,
        yieldValue: row.yieldValue,
        yieldUnit: row.yieldUnit,
        costAmount: row.costAmount,
        lotId: row.lotId,
        coaUrl: row.coaUrl,
        sopVersion: row.sopVersion,
        updatedAt: row.updatedAt,
      },
    });

  const [batch] = await db
    .select()
    .from(batches)
    .where(eq(batches.id, input.id))
    .limit(1);

  return batch;
}

export async function listBatches(
  db: Database,
  options?: { status?: string; excludeArchived?: boolean },
) {
  const conditions = [];

  if (options?.status) {
    conditions.push(eq(batches.status, options.status));
  } else if (options?.excludeArchived) {
    conditions.push(ne(batches.status, "archived"));
  }

  const query = db.select().from(batches).orderBy(desc(batches.updatedAt));

  if (conditions.length === 1) {
    return query.where(conditions[0]);
  }

  if (conditions.length > 1) {
    return query.where(and(...conditions));
  }

  return query;
}

export async function getBatchById(db: Database, id: string) {
  const [batch] = await db
    .select()
    .from(batches)
    .where(eq(batches.id, id))
    .limit(1);

  if (!batch) {
    throw new ApiError("Batch not found", 404);
  }

  return batch;
}

export async function patchBatch(
  db: Database,
  id: string,
  input: BatchPatchInput,
) {
  const existing = await getBatchById(db, id);
  const merged = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  return upsertBatch(db, merged as BatchUpsertInput);
}

export async function listBatchCodes(db: Database, type: string) {
  const rows = await db
    .select({ code: batches.code })
    .from(batches)
    .where(eq(batches.type, type));

  return rows.map((row) => row.code);
}
