import { getDb } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api/http";
import { photoUpsertSchema } from "@/lib/api/schemas";
import { upsertPhoto } from "@/lib/services/photos";

export async function POST(request: Request) {
  try {
    const body = photoUpsertSchema.parse(await request.json());
    const db = getDb();
    const photo = await upsertPhoto(db, body);

    return jsonOk({ photo }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
