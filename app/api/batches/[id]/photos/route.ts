import { getDb } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api/http";
import { publicUrlForKey } from "@/lib/r2";
import { requireUserId } from "@/lib/session";
import { listPhotosForBatch } from "@/lib/services/photos";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const db = getDb();
    const photos = await listPhotosForBatch(db, userId, id);

    // Attach the resolved R2 public URL so other devices render the image
    // without depending on NEXT_PUBLIC_R2_PUBLIC_BASE_URL in the browser build.
    const withUrls = photos.map((photo) => ({
      ...photo,
      publicUrl: publicUrlForKey(photo.r2Key),
    }));

    return jsonOk({ photos: withUrls });
  } catch (error) {
    return handleApiError(error);
  }
}
