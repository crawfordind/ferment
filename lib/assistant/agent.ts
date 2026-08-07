import {
  TOOL_SCHEMAS,
  buildProposal,
  executeReadTool,
  isReadTool,
  isWriteTool,
} from "@/lib/assistant/tools";
import type {
  AssistantProvider,
  ProviderMessage,
} from "@/lib/assistant/provider";
import type {
  AssistantDataSource,
  AssistantReply,
  ChatMessage,
  Proposal,
} from "@/lib/assistant/types";

// The agent loop. Read tools execute server-side and feed back into the model;
// write tools are captured as confirm-gated proposals and never applied here. The
// loop is bounded, and a final tool-free completion guarantees a text answer.

const MAX_ITERATIONS = 6;

const SYSTEM_PROMPT = `You are Kombucha Buddy, a friendly, practical fermentation assistant inside a ferment-tracking app. You help the signed-in user look after their own live batches — kombucha and other ferments.

Grounding rules:
- Answer from the user's real data and the app's tools, not guesses. To reason about a specific batch, first call list_batches to resolve its id, then get_batch_pulse / get_attention.
- For "is this normal?" questions about how a ferment looks or smells, call check_signs and relay its guidance rather than improvising — it is the app's authoritative safety content.
- Use search_knowledge for recipe/technique questions and cite the doc titles you used.
- Keep answers short, concrete, and reassuring. Prefer the next concrete step over long explanations.

Writing data:
- You can never write to the app yourself. To log a check-in or start a batch, call propose_log_observation / propose_start_batch. These only create a proposal the user must confirm — tell them you've queued it for confirmation, don't claim it's done.`;

function contextMessage(batchId: string): ProviderMessage {
  return {
    role: "system",
    content: `The user is currently viewing the batch with id "${batchId}". Prefer it when they say "this batch" or don't name one.`,
  };
}

function safeParseArgs(
  raw: string,
): { ok: true; value: unknown } | { ok: false } {
  if (!raw || !raw.trim()) return { ok: true, value: {} };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

export type RunAssistantOptions = {
  provider: AssistantProvider;
  dataSource: AssistantDataSource;
  messages: ChatMessage[];
  /** The batch the user is looking at, if any — nudges "this batch" resolution. */
  batchId?: string;
  now?: number;
  maxIterations?: number;
};

export async function runAssistant({
  provider,
  dataSource,
  messages,
  batchId,
  now = Date.now(),
  maxIterations = MAX_ITERATIONS,
}: RunAssistantOptions): Promise<AssistantReply> {
  const convo: ProviderMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
  if (batchId) {
    convo.push(contextMessage(batchId));
  }
  for (const m of messages) {
    convo.push({ role: m.role, content: m.content });
  }

  const proposals: Proposal[] = [];

  for (let i = 0; i < maxIterations; i++) {
    const res = await provider.complete(convo, TOOL_SCHEMAS);

    if (res.toolCalls.length === 0) {
      return { message: res.content ?? "", proposals };
    }

    convo.push({
      role: "assistant",
      content: res.content,
      tool_calls: res.toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: call.arguments },
      })),
    });

    for (const call of res.toolCalls) {
      const parsed = safeParseArgs(call.arguments);
      if (!parsed.ok) {
        convo.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({
            error: "Could not parse tool arguments as JSON.",
          }),
        });
        continue;
      }

      if (isReadTool(call.name)) {
        try {
          const result = await executeReadTool(
            call.name,
            parsed.value,
            dataSource,
            now,
          );
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        } catch {
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              error: "Tool failed. Try different arguments.",
            }),
          });
        }
      } else if (isWriteTool(call.name)) {
        try {
          const outcome = await buildProposal(
            call.name,
            parsed.value,
            dataSource,
          );
          if (outcome.proposal) {
            proposals.push(outcome.proposal);
          }
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            content: outcome.toolResult,
          });
        } catch {
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              error: "Could not build that proposal.",
            }),
          });
        }
      } else {
        convo.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: `Unknown tool ${call.name}.` }),
        });
      }
    }
  }

  // Iteration budget spent — force a final tool-free answer so we never return empty.
  const final = await provider.complete(convo, []);
  return { message: final.content ?? "", proposals };
}
