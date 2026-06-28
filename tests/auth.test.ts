import { describe, expect, it } from "vitest";

import {
  SESSION_TTL_SECONDS,
  createSessionToken,
  safeEqual,
  verifySessionToken,
} from "@/lib/auth";

const SECRET = "test-secret-at-least-16-chars";

describe("auth session tokens", () => {
  it("verifies a freshly minted token", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(SECRET, now);
    expect(await verifySessionToken(token, SECRET, now + 1000)).toBe(true);
  });

  it("rejects an expired token", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(SECRET, now);
    const afterExpiry = now + SESSION_TTL_SECONDS * 1000 + 1;
    expect(await verifySessionToken(token, SECRET, afterExpiry)).toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(SECRET, now);
    expect(await verifySessionToken(token, "a-different-secret", now + 1)).toBe(
      false,
    );
  });

  it("rejects a token with a tampered expiry", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(SECRET, now);
    const signature = token.slice(token.lastIndexOf(".") + 1);
    const tampered = `${now + SESSION_TTL_SECONDS * 1000 * 2}.${signature}`;
    expect(await verifySessionToken(tampered, SECRET, now + 1)).toBe(false);
  });

  it("rejects undefined and malformed tokens", async () => {
    expect(await verifySessionToken(undefined, SECRET)).toBe(false);
    expect(await verifySessionToken("nodot", SECRET)).toBe(false);
    expect(await verifySessionToken(".abc", SECRET)).toBe(false);
  });
});

describe("safeEqual", () => {
  it("returns true only for identical strings", () => {
    expect(safeEqual("hunter2", "hunter2")).toBe(true);
    expect(safeEqual("hunter2", "hunter3")).toBe(false);
    expect(safeEqual("hunter2", "hunter")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});
