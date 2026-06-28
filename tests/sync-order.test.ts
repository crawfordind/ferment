import { describe, expect, it } from "vitest";

import type { OutboxEntry } from "@/offline/dexie";
import {
  getPendingOutboxEntries,
  sortOutboxEntries,
} from "@/offline/sync-order";

function entry(
  overrides: Partial<OutboxEntry> & Pick<OutboxEntry, "id" | "kind">,
): OutboxEntry {
  return {
    entityId: overrides.entityId ?? overrides.id,
    payload: {} as OutboxEntry["payload"],
    attempts: 0,
    status: "pending",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("sortOutboxEntries", () => {
  it("orders batch before observation before photo", () => {
    const sorted = sortOutboxEntries([
      entry({ id: "3", kind: "photo", createdAt: 1 }),
      entry({ id: "1", kind: "batch", createdAt: 2 }),
      entry({ id: "2", kind: "observation", createdAt: 3 }),
    ]);

    expect(sorted.map((item) => item.kind)).toEqual([
      "batch",
      "observation",
      "photo",
    ]);
  });

  it("preserves createdAt order within the same kind", () => {
    const sorted = sortOutboxEntries([
      entry({ id: "b2", kind: "batch", createdAt: 20 }),
      entry({ id: "b1", kind: "batch", createdAt: 10 }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["b1", "b2"]);
  });
});

describe("getPendingOutboxEntries", () => {
  it("includes pending and failed entries only", () => {
    const pending = getPendingOutboxEntries([
      entry({ id: "1", kind: "batch", status: "pending" }),
      entry({ id: "2", kind: "batch", status: "done" }),
      entry({ id: "3", kind: "observation", status: "failed" }),
    ]);

    expect(pending.map((item) => item.id)).toEqual(["1", "3"]);
  });
});
