import { cookies } from "next/headers";

import { handleApiError, jsonOk } from "@/lib/api/http";
import { EMAIL_COOKIE, SESSION_COOKIE, UID_COOKIE } from "@/lib/auth";

/** Sign out: clear the session and its readable companion cookies. */
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.delete(UID_COOKIE);
    cookieStore.delete(EMAIL_COOKIE);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
