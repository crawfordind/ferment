import { z } from "zod";

import { handleApiError, jsonOk } from "@/lib/api/http";
import { isAllowed, normalizeEmail } from "@/lib/allowlist";
import { LOGIN_TOKEN_TTL_SECONDS } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { magicLinkEmail } from "@/lib/email/templates";
import { sendMail } from "@/lib/email/mailer";
import { getEnv } from "@/lib/env";
import { createLoginToken } from "@/lib/services/users";

// nodemailer needs the Node runtime (not edge).
export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().email(),
  // Optional same-origin path to return to after sign-in.
  redirect: z.string().optional(),
});

function sanitizeRedirect(redirect: string | undefined): string | null {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { email, redirect } = requestSchema.parse(await request.json());
    const normalized = normalizeEmail(email);

    // Only send to allowlisted addresses, but always return the same response
    // so the endpoint can't be used to probe who has access.
    if (isAllowed(normalized)) {
      try {
        const env = getEnv();
        const db = getDb();
        const token = await createLoginToken(db, normalized);

        const url = new URL("/api/auth/callback", env.APP_BASE_URL);
        url.searchParams.set("token", token);
        const safeRedirect = sanitizeRedirect(redirect);
        if (safeRedirect) {
          url.searchParams.set("redirect", safeRedirect);
        }

        const mail = magicLinkEmail({
          url: url.toString(),
          expiresMinutes: Math.round(LOGIN_TOKEN_TTL_SECONDS / 60),
        });
        await sendMail({ to: normalized, ...mail });
      } catch (error) {
        // Don't leak allowlist membership via a 500; log for operators instead.
        console.error("Failed to send magic link", error);
      }
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
