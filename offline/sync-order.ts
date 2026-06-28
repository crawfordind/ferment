import type { OutboxEntry, OutboxKind } from "@/offline/dexie";

const KIND_ORDER: Record<OutboxKind, number> = {
  batch: 0,
  observation: 1,
  photo: 2,
  transcript: 3,
};

export function sortOutboxEntries(entries: OutboxEntry[]): OutboxEntry[] {
  return [...entries].sort((left, right) => {
    const kindDiff = KIND_ORDER[left.kind] - KIND_ORDER[right.kind];
    if (kindDiff !== 0) {
      return kindDiff;
    }

    return left.createdAt - right.createdAt;
  });
}

export function getPendingOutboxEntries(entries: OutboxEntry[]): OutboxEntry[] {
  return sortOutboxEntries(
    entries.filter((entry) => entry.status === "pending" || entry.status === "failed"),
  );
}
