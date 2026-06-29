import { describe, expect, it } from "vitest";

import { generateLotId } from "@/lib/lots";

/** Expected YYYYMMDD for a given instant in the local timezone (TZ-robust). */
function localStamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

describe("generateLotId", () => {
  it("appends the local finish date to the batch code", () => {
    const finishedAt = new Date(2026, 5, 28, 12, 0, 0); // local noon, 2026-06-28
    expect(generateLotId("FPJ-03", finishedAt.getTime())).toBe(
      `FPJ-03-${localStamp(finishedAt)}`,
    );
    expect(generateLotId("FPJ-03", finishedAt.getTime())).toBe("FPJ-03-20260628");
  });

  it("zero-pads month and day", () => {
    const finishedAt = new Date(2026, 0, 5, 9, 0, 0); // local, 2026-01-05
    expect(generateLotId("LABS-01", finishedAt.getTime())).toBe("LABS-01-20260105");
  });
});
