/**
 * Access-gate session helpers. Runs in both the edge middleware and Node route
 * handlers, so it uses Web Crypto (`crypto.subtle`) rather than `node:crypto`.
 *
 * The session cookie is a signed, expiring token: `${expiresAt}.${hmac}` where
 * the HMAC is over the `expiresAt` string keyed by `APP_SECRET`. No server-side
 * session store — verification is a signature + expiry check.
 */

export const SESSION_COOKIE = "ferment_session";
/** 30 days, in seconds (matches the cookie Max-Age). */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

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

/** Mint a signed session token that expires `SESSION_TTL_SECONDS` from `now`. */
export async function createSessionToken(
  secret: string,
  now: number = Date.now(),
): Promise<string> {
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  const signature = await sign(String(expiresAt), secret);
  return `${expiresAt}.${signature}`;
}

/** True when `token` is well-formed, correctly signed, and not expired. */
export async function verifySessionToken(
  token: string | undefined,
  secret: string,
  now: number = Date.now(),
): Promise<boolean> {
  if (!token) {
    return false;
  }
  const separator = token.lastIndexOf(".");
  if (separator <= 0) {
    return false;
  }
  const expiresPart = token.slice(0, separator);
  const signaturePart = token.slice(separator + 1);

  const expiresAt = Number(expiresPart);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return false;
  }

  const expected = await sign(expiresPart, secret);
  return safeEqual(expected, signaturePart);
}
