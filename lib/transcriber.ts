import { ApiError } from "@/lib/api/http";
import { getEnv } from "@/lib/env";

export type TranscribeInput = {
  /** Base64-encoded audio bytes. */
  base64: string;
  /** Container format, e.g. "webm", "mp3", "wav". */
  format: string;
  /** Optional language hint (ISO code) to improve accuracy. */
  language?: string;
};

/**
 * Provider-agnostic transcription. Swapping providers is a one-file change:
 * implement this interface and wire it into `getTranscriber`.
 */
export interface Transcriber {
  transcribe(input: TranscribeInput): Promise<string>;
}

/**
 * OpenRouter audio transcription (OpenAI-compatible). Default model is
 * Mistral's Voxtral Mini Transcribe.
 * @see https://openrouter.ai/api/v1/audio/transcriptions
 */
class OpenRouterTranscriber implements Transcriber {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async transcribe({ base64, format, language }: TranscribeInput) {
    const response = await fetch(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input_audio: { data: base64, format },
          ...(language ? { language } : {}),
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new ApiError(
        `Transcription provider failed (${response.status})${
          detail ? `: ${detail.slice(0, 200)}` : ""
        }`,
        502,
      );
    }

    const data = (await response.json()) as {
      text?: string;
      transcript?: string;
    };
    return data.text ?? data.transcript ?? "";
  }
}

let cached: Transcriber | null = null;

export function getTranscriber(): Transcriber {
  if (cached) {
    return cached;
  }

  const env = getEnv();
  switch (env.TRANSCRIPTION_PROVIDER) {
    case "openrouter":
    default:
      cached = new OpenRouterTranscriber(
        env.TRANSCRIPTION_API_KEY,
        env.TRANSCRIPTION_MODEL,
      );
  }

  return cached;
}

/** @internal test helper */
export function resetTranscriberCache(): void {
  cached = null;
}
