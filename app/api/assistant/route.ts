import { z } from "zod";

import { ApiError, handleApiError, jsonOk } from "@/lib/api/http";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { getBatchById, listBatches } from "@/lib/services/batches";
import { listObservationsForBatch } from "@/lib/services/observations";
import { runAssistant } from "@/lib/assistant/agent";
import { getAssistantProvider } from "@/lib/assistant/provider";
import type { AssistantDataSource } from "@/lib/assistant/types";
import type { Database } from "@/lib/db";
import type { FermentType } from "@/lib/schema";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1)
    .max(40),
  batchId: z.string().min(1).optional(),
});

/**
 * User-scoped data source for the buddy's read tools. Every method reads through
 * the existing services, which already filter by `userId`, so the assistant can
 * only ever see the signed-in user's own batches.
 */
function makeDataSource(db: Database, userId: string): AssistantDataSource {
  return {
    async listActiveBatches() {
      const batches = await listBatches(db, userId, { status: "active" });
      return batches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        type: b.type as FermentType,
        category: b.category,
        status: b.status,
        health: b.health,
        startedAt: b.startedAt,
      }));
    },
    async getBatch(batchId) {
      try {
        const b = await getBatchById(db, batchId, userId);
        return {
          id: b.id,
          name: b.name,
          code: b.code,
          type: b.type as FermentType,
          category: b.category,
          status: b.status,
          health: b.health,
          startedAt: b.startedAt,
        };
      } catch (error) {
        // A batch the user can't see reads as "not there" to the assistant.
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    async getObservations(batchId) {
      const rows = await listObservationsForBatch(db, userId, batchId);
      return rows.map((o) => ({
        observedAt: o.observedAt,
        ph: o.ph,
        brix: o.brix,
        tempC: o.tempC,
        chipKeys: o.chipKeys,
        note: o.note,
      }));
    },
  };
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    // Throws a 503 ApiError when the buddy isn't configured on this server.
    const provider = getAssistantProvider();

    const body = requestSchema.parse(await request.json());
    const dataSource = makeDataSource(getDb(), userId);

    const reply = await runAssistant({
      provider,
      dataSource,
      messages: body.messages,
      batchId: body.batchId,
    });

    return jsonOk(reply);
  } catch (error) {
    return handleApiError(error);
  }
}
