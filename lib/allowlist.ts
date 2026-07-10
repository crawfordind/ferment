import { getEnv } from "@/lib/env";

/** Normalize an email for comparison and storage: trimmed + lowercased. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Parsed, normalized set of emails permitted to request a login link. */
export function getAllowlist(): Set<string> {
  const raw = getEnv().AUTH_ALLOWLIST;
  return new Set(
    raw
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean),
  );
}

/** True when `email` (any casing/spacing) is on the allowlist. */
export function isAllowed(email: string): boolean {
  return getAllowlist().has(normalizeEmail(email));
}
