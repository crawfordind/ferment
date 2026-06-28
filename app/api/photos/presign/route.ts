import { handleApiError, jsonOk } from "@/lib/api/http";
import { photoPresignRequestSchema } from "@/lib/api/schemas";
import { createPresignedPutUrl, publicUrlForKey } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const { photoId, ext, prefix } = photoPresignRequestSchema.parse(
      await request.json(),
    );

    const r2Key = `${prefix}/${photoId}.${ext}`;
    const uploadUrl = await createPresignedPutUrl(r2Key);

    return jsonOk({
      uploadUrl,
      r2Key,
      publicUrl: publicUrlForKey(r2Key),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
