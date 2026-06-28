import { getDb } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api/http";
import { batchUpsertSchema } from "@/lib/api/schemas";
import { listBatches, upsertBatch } from "@/lib/services/batches";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const excludeArchived = searchParams.get("excludeArchived") === "true";

    const db = getDb();
    const rows = await listBatches(db, { status, excludeArchived });

    return jsonOk({ batches: rows });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = batchUpsertSchema.parse(await request.json());
    const db = getDb();
    const batch = await upsertBatch(db, body);

    return jsonOk({ batch }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
