import { beforeEach, describe, expect, it } from "vitest";

import { checkRateLimit, resetRateLimit } from "@/lib/request/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimit());

  it("allows up to the max within a window, then blocks", () => {
    const key = "1.2.3.4";
    const now = 1_000_000;
    const max = 3;
    const window = 60_000;

    for (let i = 0; i < max; i++) {
      const r = checkRateLimit(key, now, max, window);
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, now, max, window);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window elapses", () => {
    const key = "5.6.7.8";
    const max = 2;
    const window = 60_000;

    checkRateLimit(key, 0, max, window);
    checkRateLimit(key, 0, max, window);
    expect(checkRateLimit(key, 0, max, window).allowed).toBe(false);

    // A hit after the window opens a fresh allowance.
    expect(checkRateLimit(key, window + 1, max, window).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const max = 1;
    const window = 60_000;
    expect(checkRateLimit("a", 0, max, window).allowed).toBe(true);
    expect(checkRateLimit("b", 0, max, window).allowed).toBe(true);
    expect(checkRateLimit("a", 0, max, window).allowed).toBe(false);
  });
});
