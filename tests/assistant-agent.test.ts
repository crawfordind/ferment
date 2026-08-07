import { describe, expect, it } from "vitest";

import { runAssistant } from "@/lib/assistant/agent";
import type {
  AssistantProvider,
  ProviderResponse,
} from "@/lib/assistant/provider";
import type {
  AssistantBatch,
  AssistantDataSource,
} from "@/lib/assistant/types";

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;

const BATCH: AssistantBatch = {
  id: "b1",
  name: "House Booch",
  code: "FOOD-1",
  type: "food",
  category: "food",
  status: "active",
  health: "on_track",
  startedAt: NOW - 3 * DAY,
};

const dataSource: AssistantDataSource = {
  listActiveBatches: async () => [BATCH],
  getBatch: async (id) => (id === BATCH.id ? BATCH : null),
  getObservations: async () => [],
};

/** A provider that replays a scripted sequence of completions, one per call. */
function scriptedProvider(
  script: ProviderResponse[],
): AssistantProvider & { calls: number } {
  return {
    calls: 0,
    async complete() {
      const step = script[this.calls] ?? { content: "", toolCalls: [] };
      this.calls += 1;
      return step;
    },
  };
}

describe("runAssistant", () => {
  it("executes a read tool then returns the final message", async () => {
    const provider = scriptedProvider([
      {
        content: null,
        toolCalls: [{ id: "t1", name: "list_batches", arguments: "{}" }],
      },
      { content: "You have one batch: House Booch.", toolCalls: [] },
    ]);

    const reply = await runAssistant({
      provider,
      dataSource,
      messages: [{ role: "user", content: "what do I have?" }],
      now: NOW,
    });

    expect(provider.calls).toBe(2);
    expect(reply.message).toBe("You have one batch: House Booch.");
    expect(reply.proposals).toHaveLength(0);
  });

  it("captures a write tool as a confirm-gated proposal without applying it", async () => {
    const provider = scriptedProvider([
      {
        content: null,
        toolCalls: [
          {
            id: "t1",
            name: "propose_log_observation",
            arguments: JSON.stringify({ batchId: "b1", note: "tart" }),
          },
        ],
      },
      { content: "I've queued a check-in for you to confirm.", toolCalls: [] },
    ]);

    const reply = await runAssistant({
      provider,
      dataSource,
      messages: [{ role: "user", content: "log that it's tart" }],
      now: NOW,
    });

    expect(reply.proposals).toHaveLength(1);
    expect(reply.proposals[0]).toMatchObject({
      kind: "log_observation",
      batchId: "b1",
      note: "tart",
    });
  });

  it("recovers from malformed tool arguments", async () => {
    const provider = scriptedProvider([
      {
        content: null,
        toolCalls: [
          { id: "t1", name: "get_batch_pulse", arguments: "{not json" },
        ],
      },
      { content: "Which batch did you mean?", toolCalls: [] },
    ]);

    const reply = await runAssistant({
      provider,
      dataSource,
      messages: [{ role: "user", content: "how is it?" }],
      now: NOW,
    });

    expect(reply.message).toBe("Which batch did you mean?");
  });

  it("forces a final answer when the iteration budget is exhausted", async () => {
    // Always asks for a tool; the loop must still return a text answer.
    const provider: AssistantProvider = {
      async complete(_messages, tools) {
        if (tools.length === 0) {
          return { content: "Here's what I found.", toolCalls: [] };
        }
        return {
          content: null,
          toolCalls: [{ id: "t", name: "list_batches", arguments: "{}" }],
        };
      },
    };

    const reply = await runAssistant({
      provider,
      dataSource,
      messages: [{ role: "user", content: "loop" }],
      now: NOW,
      maxIterations: 2,
    });

    expect(reply.message).toBe("Here's what I found.");
  });
});
