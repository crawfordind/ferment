/**
 * A tiny in-memory fixed-window rate limiter for the public `/request`
 * endpoint. The PRD only asks for a server-side limit as basic spam defense
 * (honeypot is the first line), so this is deliberately dependency-free.
 *
 * Caveat: memory is per-process, so on a multi-instance serverless deployment
 * the effective limit is per-instance. That's fine for the stated goal — it
 * stops a single client hammering one instance. If abuse becomes a real problem
 * (PRD §7), swap this for a shared store (e.g. Turso/Redis) behind the same API.
 */

type Window = { count: number; resetAt: number };

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5; // submissions per IP per window

const hits = new Map<string, Window>();

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

/**
 * Record a hit for `key` (typically an IP). Returns whether it's allowed and
 * how many remain in the current window. `now` is injectable for tests.
 */
export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  max: number = MAX_PER_WINDOW,
  windowMs: number = WINDOW_MS,
): RateLimitResult {
  const existing = hits.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    hits.set(key, { count: 1, resetAt });
    sweep(now);
    return { allowed: true, remaining: max - 1, resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= max;
  return { allowed, remaining: Math.max(0, max - existing.count), resetAt: existing.resetAt };
}

/** Drop expired windows so the map can't grow unbounded. */
function sweep(now: number): void {
  for (const [key, win] of hits) {
    if (now >= win.resetAt) hits.delete(key);
  }
}

/** @internal test helper */
export function resetRateLimit(): void {
  hits.clear();
}
