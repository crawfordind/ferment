import { ApiError } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import type { ToolSchema } from "@/lib/assistant/tools";

// Provider-agnostic chat completion with tool-calling, mirroring the transcriber:
// swapping providers is a one-file change. Default is OpenRouter's OpenAI-compatible
// chat endpoint, the same host the voice transcriber already uses.

/** A tool call the model wants executed. `arguments` is a JSON string. */
export type ProviderToolCall = {
  id: string;
  name: string;
  arguments: string;
};

/** OpenAI-compatible message shapes exchanged with the provider. */
export type ProviderMessage =
  | { role: "system" | "user"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: {
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }[];
    }
  | { role: "tool"; tool_call_id: string; content: string };

export type ProviderResponse = {
  content: string | null;
  toolCalls: ProviderToolCall[];
};

export interface AssistantProvider {
  complete(
    messages: ProviderMessage[],
    tools: ToolSchema[],
  ): Promise<ProviderResponse>;
}

type OpenAiChoice = {
  message?: {
    content?: string | null;
    tool_calls?: {
      id: string;
      function: { name: string; arguments: string };
    }[];
  };
};

/** OpenRouter chat completions (OpenAI-compatible). */
class OpenRouterProvider implements AssistantProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(
    messages: ProviderMessage[],
    tools: ToolSchema[],
  ): Promise<ProviderResponse> {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools,
          tool_choice: "auto",
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new ApiError(
        `Assistant provider failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
        502,
      );
    }

    const data = (await response.json()) as { choices?: OpenAiChoice[] };
    const message = data.choices?.[0]?.message;
    return {
      content: message?.content ?? null,
      toolCalls: (message?.tool_calls ?? []).map((call) => ({
        id: call.id,
        name: call.function.name,
        arguments: call.function.arguments,
      })),
    };
  }
}

let cached: AssistantProvider | null = null;

/** True when the buddy is configured (an API key is set). */
export function isAssistantConfigured(): boolean {
  return Boolean(getEnv().ASSISTANT_API_KEY);
}

/** The provider, or a 503 `ApiError` when the buddy isn't configured. */
export function getAssistantProvider(): AssistantProvider {
  if (cached) {
    return cached;
  }

  const env = getEnv();
  if (!env.ASSISTANT_API_KEY) {
    throw new ApiError("The assistant is not configured on this server.", 503);
  }

  switch (env.ASSISTANT_PROVIDER) {
    case "openrouter":
    default:
      cached = new OpenRouterProvider(
        env.ASSISTANT_API_KEY,
        env.ASSISTANT_MODEL,
      );
  }

  return cached;
}

/** @internal test helper */
export function resetAssistantProviderCache(): void {
  cached = null;
}
