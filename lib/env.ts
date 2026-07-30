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
  APP_SECRET: z.string().min(16, "APP_SECRET must be at least 16 characters"),
  // Canonical origin used to build magic-link URLs, e.g. https://myferment.com.
  // `.trim()` guards against a stray space/newline pasted into the env value.
  APP_BASE_URL: z.string().trim().url("APP_BASE_URL must be a valid URL"),
  // Comma-separated list of emails allowed to request a login link.
  AUTH_ALLOWLIST: z.string().min(1, "AUTH_ALLOWLIST is required"),
  // SMTP (mxroute). Host/user/from are trimmed so a trailing space in the env
  // value can't break DNS resolution or the auth handshake.
  SMTP_HOST: z.string().trim().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().trim().min(1, "SMTP_USER is required"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required"),
  // From header, e.g. "MyFerment <login@myferment.com>"
  SMTP_FROM: z.string().trim().min(1, "SMTP_FROM is required"),
  // Where public quote-request notifications go. Optional — falls back to the
  // SMTP_FROM address so a missing value never drops a lead.
  INQUIRY_NOTIFY_EMAIL: z.string().trim().email().optional(),
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
