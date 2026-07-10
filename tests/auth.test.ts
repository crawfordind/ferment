import { describe, expect, it } from "vitest";

import {
  SESSION_TTL_SECONDS,
  createSessionToken,
  generateLoginToken,
  hashLoginToken,
  safeEqual,
  verifySessionToken,
} from "@/lib/auth";

const SECRET = "test-secret-at-least-16-chars";
const USER_ID = "018f0000-0000-7000-8000-000000000abc";

describe("auth session tokens", () => {
  it("returns the user id for a freshly minted token", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(USER_ID, SECRET, now);
    expect(await verifySessionToken(token, SECRET, now + 1000)).toBe(USER_ID);
  });

  it("rejects an expired token", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(USER_ID, SECRET, now);
    const afterExpiry = now + SESSION_TTL_SECONDS * 1000 + 1;
    expect(await verifySessionToken(token, SECRET, afterExpiry)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(USER_ID, SECRET, now);
    expect(
      await verifySessionToken(token, "a-different-secret", now + 1),
    ).toBeNull();
  });

  it("rejects a token with a tampered expiry", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(USER_ID, SECRET, now);
    const signature = token.slice(token.lastIndexOf(".") + 1);
    const tampered = `${USER_ID}.${now + SESSION_TTL_SECONDS * 1000 * 2}.${signature}`;
    expect(await verifySessionToken(tampered, SECRET, now + 1)).toBeNull();
  });

  it("rejects a token with a tampered user id", async () => {
    const now = 1_000_000;
    const token = await createSessionToken(USER_ID, SECRET, now);
    const [, expiresPart, signaturePart] = token.split(".");
    const tampered = `someone-else.${expiresPart}.${signaturePart}`;
    expect(await verifySessionToken(tampered, SECRET, now + 1)).toBeNull();
  });

  it("rejects undefined and malformed tokens", async () => {
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
    expect(await verifySessionToken("nodot", SECRET)).toBeNull();
    expect(await verifySessionToken("only.two", SECRET)).toBeNull();
    expect(await verifySessionToken("..", SECRET)).toBeNull();
  });
});

describe("magic-link tokens", () => {
  it("generates high-entropy, distinct tokens", () => {
    const a = generateLoginToken();
    const b = generateLoginToken();
    expect(a).toHaveLength(64);
    expect(a).toMatch(/^[0-9a-f]+$/);
    expect(a).not.toBe(b);
  });

  it("hashes deterministically", async () => {
    const token = generateLoginToken();
    expect(await hashLoginToken(token)).toBe(await hashLoginToken(token));
    expect(await hashLoginToken(token)).toHaveLength(64);
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
