import { getDb } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api/http";
import { photoUpsertSchema } from "@/lib/api/schemas";
import { requireUserId } from "@/lib/session";
import { upsertPhoto } from "@/lib/services/photos";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = photoUpsertSchema.parse(await request.json());
    const db = getDb();
    const photo = await upsertPhoto(db, userId, body);

    return jsonOk({ photo }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
