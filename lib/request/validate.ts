import { z } from "zod";

import { ApiError } from "@/lib/api/http";
import { COMMON_FIELDS, getService, type Field, type ServiceType } from "@/lib/request/config";

/** The hidden honeypot field name. A real user's browser leaves it empty. */
export const HONEYPOT_FIELD = "company";

/**
 * The wire envelope. Branch-specific answers arrive in `payload`; we validate
 * their required-ness against the shared field config below so the UI and the
 * server never disagree about what's mandatory.
 */
const envelopeSchema = z.object({
  serviceType: z.string(),
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("A valid email is required").max(320),
  phone: z.string().trim().max(50).optional().default(""),
  source: z.string().trim().max(100).optional().default(""),
  notes: z.string().trim().max(5000).optional().default(""),
  payload: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional().default({}),
  // Honeypot — must be blank. Bots fill every field they see.
  [HONEYPOT_FIELD]: z.string().optional().default(""),
});

export type ValidatedInquiry = {
  serviceType: ServiceType;
  name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  /** Cleaned branch answers, empties dropped. */
  payload: Record<string, string | string[]>;
};

function isEmpty(value: string | string[] | undefined): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value.trim().length === 0;
}

function cleanField(field: Field, raw: string | string[] | undefined): string | string[] | undefined {
  if (raw === undefined) return undefined;
  if (field.type === "multiselect") {
    const arr = (Array.isArray(raw) ? raw : [raw]).map((v) => v.trim()).filter(Boolean);
    return arr.length > 0 ? arr : undefined;
  }
  const value = Array.isArray(raw) ? raw.join(", ") : raw;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type ValidationResult =
  | { spam: true }
  | { spam: false; inquiry: ValidatedInquiry };

/**
 * Parse + validate a `/request` submission. Throws {@link ApiError} (400) on a
 * bad envelope or a missing required branch field. Returns `{ spam: true }`
 * when the honeypot is tripped so the caller can quietly no-op.
 */
export function validateInquiry(body: unknown): ValidationResult {
  const parsed = envelopeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid submission", 400);
  }
  const data = parsed.data;

  if (data[HONEYPOT_FIELD].trim().length > 0) {
    return { spam: true };
  }

  const service = getService(data.serviceType);
  if (!service) {
    throw new ApiError("Unknown service", 400);
  }
  if (!service.enabled) {
    // A branch that isn't live yet shouldn't be accepting submissions.
    throw new ApiError("That service isn't open for requests yet", 400);
  }

  const cleanPayload: Record<string, string | string[]> = {};
  for (const field of service.fields) {
    const cleaned = cleanField(field, data.payload[field.name]);
    if (field.required && isEmpty(cleaned)) {
      throw new ApiError(`${field.label} is required`, 400);
    }
    if (cleaned !== undefined) {
      cleanPayload[field.name] = cleaned;
    }
  }

  // Guard against unknown common fields being smuggled through payload.
  const commonNames = new Set(COMMON_FIELDS.map((f) => f.name));
  for (const key of Object.keys(cleanPayload)) {
    if (commonNames.has(key)) delete cleanPayload[key];
  }

  return {
    spam: false,
    inquiry: {
      serviceType: service.type,
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: data.source,
      notes: data.notes,
      payload: cleanPayload,
    },
  };
}
