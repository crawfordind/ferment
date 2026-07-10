import { NextResponse } from "next/server";

import { isAllowed } from "@/lib/allowlist";
import {
  EMAIL_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  UID_COOKIE,
  createSessionToken,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { consumeLoginToken, upsertUserByEmail } from "@/lib/services/users";

export const runtime = "nodejs";

function sanitizeRedirect(redirect: string | null): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/";
}

/** Redirect back to the login screen with a reason code. */
function loginError(request: Request, reason: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const redirect = sanitizeRedirect(searchParams.get("redirect"));

  if (!token) {
    return loginError(request, "invalid");
  }

  const db = getDb();
  const email = await consumeLoginToken(db, token);

  if (!email) {
    return loginError(request, "expired");
  }

  // Re-check the allowlist at redemption in case access was revoked after the
  // link was issued.
  if (!isAllowed(email)) {
    return loginError(request, "forbidden");
  }

  const user = await upsertUserByEmail(db, email);
  const sessionToken = await createSessionToken(user.id, getEnv().APP_SECRET);

  const response = NextResponse.redirect(new URL(redirect, request.url));

  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  // Readable companions: identify the account client-side (cache guard) and show
  // the signed-in email. Neither grants access on its own.
  response.cookies.set(UID_COOKIE, user.id, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  response.cookies.set(EMAIL_COOKIE, user.email, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}
