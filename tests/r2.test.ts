import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetEnvCache } from "@/lib/env";
import { publicUrlForKey } from "@/lib/r2";

const r2Env = {
  TURSO_DATABASE_URL: "libsql://test.turso.io",
  TURSO_AUTH_TOKEN: "test-token",
  R2_ACCOUNT_ID: "account-id",
  R2_ACCESS_KEY_ID: "access-key",
  R2_SECRET_ACCESS_KEY: "secret-key",
  R2_BUCKET: "bucket",
  TRANSCRIPTION_API_KEY: "transcription-key",
  TRANSCRIPTION_PROVIDER: "openai",
  APP_PASSCODE: "passcode",
  APP_SECRET: "secret-at-least-16-chars",
};

describe("publicUrlForKey", () => {
  beforeEach(() => {
    resetEnvCache();
    Object.assign(process.env, r2Env);
  });

  afterEach(() => {
    resetEnvCache();
    for (const key of Object.keys(r2Env)) {
      delete process.env[key];
    }
    delete process.env.R2_PUBLIC_BASE_URL;
  });

  it("joins the public base URL and key so other devices can render the photo", () => {
    process.env.R2_PUBLIC_BASE_URL = "https://cdn.example.com";
    expect(publicUrlForKey("photos/abc.jpg")).toBe(
      "https://cdn.example.com/photos/abc.jpg",
    );
  });

  it("normalizes a trailing slash on the base URL", () => {
    process.env.R2_PUBLIC_BASE_URL = "https://cdn.example.com/";
    expect(publicUrlForKey("photos/abc.jpg")).toBe(
      "https://cdn.example.com/photos/abc.jpg",
    );
  });
});
