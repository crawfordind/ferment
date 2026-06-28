import { getDb } from "@/lib/db";
import { ApiError, handleApiError, jsonOk } from "@/lib/api/http";
import { observationUpsertSchema } from "@/lib/api/schemas";
import {
  listObservationsForBatch,
  upsertObservation,
} from "@/lib/services/observations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDb();
    const observations = await listObservationsForBatch(db, id);

    return jsonOk({ observations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: batchId } = await context.params;
    const body = observationUpsertSchema.parse(await request.json());

    if (body.batchId !== batchId) {
      throw new ApiError("batchId mismatch", 400);
    }

    const db = getDb();
    const observation = await upsertObservation(db, body);

    return jsonOk({ observation }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
