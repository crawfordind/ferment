import { cookies } from "next/headers";

import { ApiError } from "@/lib/api/http";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getEnv } from "@/lib/env";

/**
 * The signed-in user's id from the session cookie, or `null` when there's no
 * valid session. Route handlers are already behind the auth middleware, but this
 * re-verifies the signature so identity is never taken on trust.
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, getEnv().APP_SECRET);
}

/** Like {@link getSessionUserId}, but throws a 401 when unauthenticated. */
export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new ApiError("Unauthorized", 401);
  }
  return userId;
}
