import { afterEach, describe, expect, it } from "vitest";

import { resetEnvCache, validateEnv } from "@/lib/env";

const validEnv = {
  TURSO_DATABASE_URL: "libsql://test.turso.io",
  TURSO_AUTH_TOKEN: "test-token",
  R2_ACCOUNT_ID: "account-id",
  R2_ACCESS_KEY_ID: "access-key",
  R2_SECRET_ACCESS_KEY: "secret-key",
  R2_BUCKET: "bucket",
  R2_PUBLIC_BASE_URL: "https://example.com",
  TRANSCRIPTION_API_KEY: "transcription-key",
  TRANSCRIPTION_PROVIDER: "openai",
  APP_PASSCODE: "passcode",
  APP_SECRET: "secret-at-least-16-chars",
};

describe("validateEnv", () => {
  afterEach(() => {
    resetEnvCache();
    for (const key of Object.keys(validEnv)) {
      delete process.env[key];
    }
  });

  it("passes with all required variables", () => {
    Object.assign(process.env, validEnv);
    const env = validateEnv();
    expect(env.TURSO_DATABASE_URL).toBe(validEnv.TURSO_DATABASE_URL);
  });

  it("fails loudly when a required variable is missing", () => {
    Object.assign(process.env, validEnv);
    delete process.env.TURSO_DATABASE_URL;

    expect(() => validateEnv()).toThrow(/TURSO_DATABASE_URL/);
  });
});
