import { z } from "zod";

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1, "TURSO_DATABASE_URL is required"),
  TURSO_AUTH_TOKEN: z.string().min(1, "TURSO_AUTH_TOKEN is required"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET: z.string().min(1, "R2_BUCKET is required"),
  R2_PUBLIC_BASE_URL: z.string().url("R2_PUBLIC_BASE_URL must be a valid URL"),
  TRANSCRIPTION_API_KEY: z
    .string()
    .min(1, "TRANSCRIPTION_API_KEY is required"),
  TRANSCRIPTION_PROVIDER: z.string().min(1).default("openrouter"),
  TRANSCRIPTION_MODEL: z
    .string()
    .min(1)
    .default("mistralai/voxtral-mini-transcribe"),
  APP_PASSCODE: z.string().min(1, "APP_PASSCODE is required"),
  APP_SECRET: z.string().min(16, "APP_SECRET must be at least 16 characters"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/** @internal test helper */
export function resetEnvCache(): void {
  cachedEnv = null;
}

export function validateEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in all required values.`,
    );
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function getEnv(): Env {
  return validateEnv();
}
