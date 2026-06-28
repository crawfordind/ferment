import { describe, expect, it } from "vitest";

import { computeAttention } from "@/lib/attention";
import { getSeedTemplate } from "@/lib/seed-data";

const MS_PER_DAY = 86_400_000;
const fpj = getSeedTemplate("fpj")!;

function at(day: number): number {
  return day * MS_PER_DAY;
}

const active = (health: "on_track" | "watch" | "needs_action") => ({
  startedAt: 0,
  status: "active" as const,
  health,
});

describe("computeAttention", () => {
  it("ignores non-active batches", () => {
    const result = computeAttention(
      { startedAt: 0, status: "finished", health: "needs_action" },
      fpj,
      at(9),
    );
    expect(result.needsAttention).toBe(false);
  });

  it("is calm for an on_track batch inside its schedule", () => {
    const result = computeAttention(active("on_track"), fpj, at(4));
    expect(result.needsAttention).toBe(false);
  });

  it("surfaces a needs_action health signal", () => {
    const result = computeAttention(active("needs_action"), fpj, at(4));
    expect(result.needsAttention).toBe(true);
    expect(result.reason).toBe("needs_action");
    expect(result.hint).toBe("Worth a look");
  });

  it("surfaces a watch health signal at low priority", () => {
    const result = computeAttention(active("watch"), fpj, at(4));
    expect(result.reason).toBe("watch");
    expect(result.priority).toBe(1);
  });

  it("flags a due-today discrete action with a concrete hint", () => {
    // FPJ "Strain" is day 7.
    const result = computeAttention(active("on_track"), fpj, at(7));
    expect(result.reason).toBe("due_today");
    expect(result.hint).toBe("Strain today");
  });

  it("flags an overdue action at top priority", () => {
    const result = computeAttention(active("on_track"), fpj, at(9));
    expect(result.reason).toBe("overdue");
    expect(result.hint).toBe("Strain overdue");
    expect(result.priority).toBe(4);
  });

  it("prefers overdue over a needs_action health signal", () => {
    const result = computeAttention(active("needs_action"), fpj, at(9));
    expect(result.reason).toBe("overdue");
    expect(result.priority).toBe(4);
  });
});
