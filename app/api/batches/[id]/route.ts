import { getDb } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api/http";
import { batchPatchSchema } from "@/lib/api/schemas";
import { getBatchById, patchBatch } from "@/lib/services/batches";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDb();
    const batch = await getBatchById(db, id);

    return jsonOk({ batch });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = batchPatchSchema.parse(await request.json());
    const db = getDb();
    const batch = await patchBatch(db, id, body);

    return jsonOk({ batch });
  } catch (error) {
    return handleApiError(error);
  }
}
