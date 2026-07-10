import { and, eq, gt, isNull } from "drizzle-orm";

import { normalizeEmail } from "@/lib/allowlist";
import {
  LOGIN_TOKEN_TTL_SECONDS,
  generateLoginToken,
  hashLoginToken,
} from "@/lib/auth";
import { SEED_USER_EMAIL, SEED_USER_ID } from "@/lib/auth-constants";
import type { Database } from "@/lib/db";
import { newId } from "@/lib/id";
import { loginTokens, users, type User } from "@/lib/schema";

/**
 * Issue a single-use magic-link token for `email`. Stores only the SHA-256 hash;
 * returns the raw token to embed in the emailed URL.
 */
export async function createLoginToken(
  db: Database,
  email: string,
  now: number = Date.now(),
): Promise<string> {
  const rawToken = generateLoginToken();
  const tokenHash = await hashLoginToken(rawToken);

  await db.insert(loginTokens).values({
    id: newId(),
    email: normalizeEmail(email),
    tokenHash,
    expiresAt: now + LOGIN_TOKEN_TTL_SECONDS * 1000,
    consumedAt: null,
    createdAt: now,
  });

  return rawToken;
}

/**
 * Redeem a raw magic-link token. Returns the associated email on success (and
 * marks the token consumed so it can't be replayed), or `null` if the token is
 * unknown, already used, or expired.
 */
export async function consumeLoginToken(
  db: Database,
  rawToken: string,
  now: number = Date.now(),
): Promise<string | null> {
  const tokenHash = await hashLoginToken(rawToken);

  const [row] = await db
    .select()
    .from(loginTokens)
    .where(
      and(
        eq(loginTokens.tokenHash, tokenHash),
        isNull(loginTokens.consumedAt),
        gt(loginTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  await db
    .update(loginTokens)
    .set({ consumedAt: now })
    .where(eq(loginTokens.id, row.id));

  return row.email;
}

/**
 * Find or create the user for `email`, stamping `lastLoginAt`. The original
 * owner's address maps to the stable seed id so their pre-accounts data stays
 * attached.
 */
export async function upsertUserByEmail(
  db: Database,
  email: string,
  now: number = Date.now(),
): Promise<User> {
  const normalized = normalizeEmail(email);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ lastLoginAt: now })
      .where(eq(users.id, existing.id));
    return { ...existing, lastLoginAt: now };
  }

  const id = normalized === SEED_USER_EMAIL ? SEED_USER_ID : newId();
  const user = {
    id,
    email: normalized,
    name: null,
    createdAt: now,
    lastLoginAt: now,
  };
  await db.insert(users).values(user);
  return user;
}
