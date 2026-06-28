import { cookies } from "next/headers";
import { z } from "zod";

import { handleApiError, jsonOk } from "@/lib/api/http";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  safeEqual,
} from "@/lib/auth";
import { getEnv } from "@/lib/env";

const unlockSchema = z.object({ passcode: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const { passcode } = unlockSchema.parse(await request.json());
    const env = getEnv();

    if (!safeEqual(passcode, env.APP_PASSCODE)) {
      return Response.json({ error: "Incorrect passcode" }, { status: 401 });
    }

    const token = await createSessionToken(env.APP_SECRET);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Lock the app again by clearing the session cookie. */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
