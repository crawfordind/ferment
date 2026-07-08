import { describe, expect, it } from "vitest";

import {
  computeBatchProgress,
  formatProgressLabel,
  formatReadyDate,
  templateLengthDays,
} from "@/lib/progress";
import type { StageLike } from "@/lib/stages";

const DAY = 86_400_000;

function stage(
  partial: Partial<StageLike> & Pick<StageLike, "stageIndex" | "dayStart">,
): StageLike {
  return {
    name: "s",
    dayEnd: null,
    expectationText: "",
    actionLabel: null,
    ...partial,
  };
}

// A 14-day template (final stage ends day 14), like the "Apple LABs" mockup.
const template = {
  stages: [
    stage({ stageIndex: 0, dayStart: 0, dayEnd: 2 }),
    stage({ stageIndex: 1, dayStart: 3, dayEnd: 13 }),
    stage({ stageIndex: 2, dayStart: 14, dayEnd: 14, actionLabel: "Strain" }),
  ],
};

// Reference start: 2026-07-05 local midnight, so day math is stable.
const START = new Date(2026, 6, 5, 0, 0, 0, 0).getTime();

describe("templateLengthDays", () => {
  it("uses the final stage's end day", () => {
    expect(templateLengthDays(template)).toBe(14);
  });

  it("returns null for open-ended templates (final dayEnd null)", () => {
    expect(
      templateLengthDays({ stages: [stage({ stageIndex: 0, dayStart: 0 })] }),
    ).toBeNull();
  });

  it("returns null when there is no template", () => {
    expect(templateLengthDays(null)).toBeNull();
    expect(templateLengthDays({ stages: [] })).toBeNull();
  });
});

describe("computeBatchProgress", () => {
  it("reports mid-run progress with a ready date", () => {
    const p = computeBatchProgress(
      { startedAt: START },
      template,
      START + 8 * DAY,
    );
    expect(p.day).toBe(8);
    expect(p.totalDays).toBe(14);
    expect(p.percent).toBeCloseTo(8 / 14, 5);
    expect(p.phase).toBe("mid");
    expect(p.readyAt).toBe(START + 14 * DAY);
  });

  it("marks day 0–1 as early", () => {
    expect(
      computeBatchProgress({ startedAt: START }, template, START + 1 * DAY)
        .phase,
    ).toBe("early");
  });

  it("marks ≥80% as nearly", () => {
    expect(
      computeBatchProgress({ startedAt: START }, template, START + 12 * DAY)
        .phase,
    ).toBe("nearly");
  });

  it("marks the exact ready day as ready and clamps percent at 1", () => {
    const p = computeBatchProgress(
      { startedAt: START },
      template,
      START + 14 * DAY,
    );
    expect(p.phase).toBe("ready");
    expect(p.percent).toBe(1);
  });

  it("marks a batch past its ready day as overdue", () => {
    const p = computeBatchProgress(
      { startedAt: START },
      template,
      START + 20 * DAY,
    );
    expect(p.phase).toBe("overdue");
    expect(p.percent).toBe(1);
  });

  it("stays open (no total) for template-less batches", () => {
    const p = computeBatchProgress({ startedAt: START }, null, START + 3 * DAY);
    expect(p).toMatchObject({
      day: 3,
      totalDays: null,
      percent: null,
      readyAt: null,
      phase: "open",
    });
  });
});

describe("formatProgressLabel", () => {
  it("shows day-of-N and ready date mid-run", () => {
    const p = computeBatchProgress(
      { startedAt: START },
      template,
      START + 8 * DAY,
    );
    expect(formatProgressLabel(p)).toBe("Day 8 of ~14 · ready Jul 19");
  });

  it("drops the total but keeps a ready-by date when overdue", () => {
    const p = computeBatchProgress(
      { startedAt: START },
      template,
      START + 20 * DAY,
    );
    expect(formatProgressLabel(p)).toBe("Day 20 · ready by Jul 19");
  });

  it("shows just the day for open-ended batches", () => {
    const p = computeBatchProgress({ startedAt: START }, null, START + 2 * DAY);
    expect(formatProgressLabel(p)).toBe("Day 2");
  });
});

describe("formatReadyDate", () => {
  it("formats a short month + day", () => {
    expect(formatReadyDate(new Date(2026, 6, 13).getTime())).toBe("Jul 13");
    expect(formatReadyDate(new Date(2026, 0, 1).getTime())).toBe("Jan 1");
  });
});
