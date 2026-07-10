/**
 * Session + magic-link token helpers. Runs in both the edge middleware and Node
 * route handlers, so it uses Web Crypto (`crypto.subtle`) rather than
 * `node:crypto`.
 *
 * The session cookie is a signed, expiring token that also carries the user id:
 * `${userId}.${expiresAt}.${hmac}` where the HMAC is over `${userId}.${expiresAt}`
 * keyed by `APP_SECRET`. No server-side session store — verification is a
 * signature + expiry check, and the caller's identity falls out of the token.
 */

/** httpOnly signed session cookie. */
export const SESSION_COOKIE = "ferment_session";
/**
 * Readable (non-httpOnly) companion cookie holding the current user id. The
 * client uses it to detect an account switch on a shared device and wipe the
 * local cache; it grants nothing on its own (the httpOnly session is the gate).
 */
export const UID_COOKIE = "ferment_uid";
/** Readable cookie holding the signed-in email, for display only. */
export const EMAIL_COOKIE = "ferment_email";

/** 30 days, in seconds (matches the cookie Max-Age). */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
/** Magic-link tokens are short-lived. */
export const LOGIN_TOKEN_TTL_SECONDS = 60 * 15;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return toHex(signature);
}

/** Length-constant string comparison to avoid leaking equality via timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Mint a signed session token for `userId` that expires `SESSION_TTL_SECONDS`
 * from `now`.
 */
export async function createSessionToken(
  userId: string,
  secret: string,
  now: number = Date.now(),
): Promise<string> {
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

/**
 * Return the signed-in user id when `token` is well-formed, correctly signed,
 * and unexpired; otherwise `null`. (A boolean-y check: `null` is falsy.)
 */
export async function verifySessionToken(
  token: string | undefined,
  secret: string,
  now: number = Date.now(),
): Promise<string | null> {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [userId, expiresPart, signaturePart] = parts;
  if (!userId || !expiresPart || !signaturePart) {
    return null;
  }

  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return null;
  }

  const expected = await sign(`${userId}.${expiresPart}`, secret);
  return safeEqual(expected, signaturePart) ? userId : null;
}

/** A URL-safe, high-entropy magic-link token (32 random bytes, hex). */
export function generateLoginToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * SHA-256 hex of a magic-link token. Only the hash is stored server-side, so a
 * database leak can't be replayed to log in.
 */
export async function hashLoginToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return toHex(digest);
}
