import { describe, expect, it } from "vitest";

import { buildProposal, executeReadTool } from "@/lib/assistant/tools";
import type {
  AssistantBatch,
  AssistantDataSource,
  AssistantObservation,
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
  health: "watch",
  startedAt: NOW - 5 * DAY,
};

const OBSERVATIONS: AssistantObservation[] = [
  {
    observedAt: NOW - 4 * DAY,
    ph: 4.5,
    brix: null,
    tempC: 22,
    chipKeys: ["smell_sweet"],
    note: "day 1",
  },
  {
    observedAt: NOW - 1 * DAY,
    ph: 3.6,
    brix: null,
    tempC: 22,
    chipKeys: ["surface_white_film"],
    note: "filmy",
  },
];

function fakeSource(
  overrides?: Partial<AssistantDataSource>,
): AssistantDataSource {
  return {
    listActiveBatches: async () => [BATCH],
    getBatch: async (id) => (id === BATCH.id ? BATCH : null),
    getObservations: async () => OBSERVATIONS,
    ...overrides,
  };
}

describe("executeReadTool", () => {
  it("list_batches reports day-in-process and health", async () => {
    const result = (await executeReadTool(
      "list_batches",
      {},
      fakeSource(),
      NOW,
    )) as {
      batches: { id: string; day: number; health: string }[];
    };
    expect(result.batches).toHaveLength(1);
    expect(result.batches[0]).toMatchObject({
      id: "b1",
      day: 5,
      health: "watch",
    });
  });

  it("get_batch_pulse returns a pulse with the measured pH trend", async () => {
    const result = (await executeReadTool(
      "get_batch_pulse",
      { batchId: "b1" },
      fakeSource(),
      NOW,
    )) as {
      pulse: {
        measurement: { metric: string; from: number; to: number } | null;
      };
    };
    expect(result.pulse.measurement).toMatchObject({
      metric: "ph",
      from: 4.5,
      to: 3.6,
    });
  });

  it("get_batch_pulse reports a missing batch instead of throwing", async () => {
    const result = (await executeReadTool(
      "get_batch_pulse",
      { batchId: "nope" },
      fakeSource(),
      NOW,
    )) as { error?: string };
    expect(result.error).toBeTruthy();
  });

  it("get_attention surfaces only batches that need attention", async () => {
    const result = (await executeReadTool(
      "get_attention",
      {},
      fakeSource(),
      NOW,
    )) as {
      items: { batchId: string; reason: string }[];
    };
    expect(result.items).toHaveLength(1);
    expect(result.items[0].batchId).toBe("b1");
  });

  it("check_signs relays the grounded reassurance for a white film", async () => {
    const result = (await executeReadTool(
      "check_signs",
      { chipKeys: ["surface_white_film"] },
      fakeSource(),
      NOW,
    )) as { guidance: { tone: string; title: string }[] };
    expect(result.guidance).toHaveLength(1);
    expect(result.guidance[0].tone).toBe("reassure");
  });

  it("search_knowledge returns capped, id-bearing results", async () => {
    const result = (await executeReadTool(
      "search_knowledge",
      { query: "kombucha" },
      fakeSource(),
      NOW,
    )) as { results: { id: string }[] };
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.length).toBeLessThanOrEqual(5);
    expect(result.results[0].id).toBeTruthy();
  });
});

describe("buildProposal", () => {
  it("builds a confirm-gated log proposal and drops unknown chip keys", async () => {
    const { proposal, toolResult } = await buildProposal(
      "propose_log_observation",
      {
        batchId: "b1",
        note: "tastes tart",
        chipKeys: ["smell_sour", "not_a_real_chip"],
        ph: 3.4,
      },
      fakeSource(),
    );
    expect(toolResult).toMatch(/confirm/i);
    expect(proposal).toMatchObject({
      kind: "log_observation",
      batchId: "b1",
      chipKeys: ["smell_sour"],
      ph: 3.4,
    });
  });

  it("returns no proposal for a batch the user can't see", async () => {
    const { proposal } = await buildProposal(
      "propose_log_observation",
      { batchId: "nope" },
      fakeSource(),
    );
    expect(proposal).toBeNull();
  });

  it("builds a start-batch proposal", async () => {
    const { proposal } = await buildProposal(
      "propose_start_batch",
      { fermentType: "fpj" },
      fakeSource(),
    );
    expect(proposal).toMatchObject({ kind: "start_batch", fermentType: "fpj" });
  });
});
