import { ApiError, handleApiError, jsonOk } from "@/lib/api/http";
import { getTranscriber } from "@/lib/transcriber";

function formatFromMime(mime: string): string {
  const subtype = mime.split("/")[1]?.split(";")[0]?.trim();
  if (!subtype) {
    return "webm";
  }
  // Normalize a few common aliases the model expects.
  if (subtype === "mpeg") return "mp3";
  if (subtype === "x-wav" || subtype === "wave") return "wav";
  return subtype;
}

export async function POST(request: Request) {
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new ApiError(
        "Expected multipart/form-data with an audio file",
        400,
      );
    }
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError("Missing audio file", 400);
    }

    const formatField = form.get("format");
    const languageField = form.get("language");
    const format =
      typeof formatField === "string" && formatField
        ? formatField
        : formatFromMime(file.type);

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const transcript = await getTranscriber().transcribe({
      base64,
      format,
      language: typeof languageField === "string" ? languageField : undefined,
    });

    return jsonOk({ transcript });
  } catch (error) {
    return handleApiError(error);
  }
}
