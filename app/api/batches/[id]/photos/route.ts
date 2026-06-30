import { getDb } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api/http";
import { listPhotosForBatch } from "@/lib/services/photos";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getDb();
    const photos = await listPhotosForBatch(db, id);

    return jsonOk({ photos });
  } catch (error) {
    return handleApiError(error);
  }
}
