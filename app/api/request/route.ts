import { handleApiError, jsonOk } from "@/lib/api/http";
import { getDb } from "@/lib/db";
import { inquiryAutoReplyEmail, inquiryNotificationEmail } from "@/lib/email/farm-templates";
import { sendMail } from "@/lib/email/mailer";
import { getEnv } from "@/lib/env";
import { newId } from "@/lib/id";
import { getService } from "@/lib/request/config";
import { checkRateLimit } from "@/lib/request/rate-limit";
import { summarizePayload } from "@/lib/request/summary";
import { validateInquiry } from "@/lib/request/validate";
import { inquiries } from "@/lib/schema";
import { getAllVarieties } from "@/lib/varieties";

// nodemailer needs the Node runtime (not edge).
export const runtime = "nodejs";

/** Best-effort client IP for the rate limiter, from the usual proxy headers. */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    // Rate limit first — cheap, and it caps abuse before any parsing.
    const limit = checkRateLimit(clientIp(request));
    if (!limit.allowed) {
      return jsonOk(
        { error: "Too many requests. Please try again later." },
        429,
      );
    }

    const result = validateInquiry(await request.json());

    // Honeypot tripped: pretend success so bots learn nothing, but store/send nothing.
    if (result.spam) {
      return jsonOk({ ok: true });
    }

    const { inquiry } = result;
    const service = getService(inquiry.serviceType)!;

    const now = Date.now();
    const db = getDb();
    await db.insert(inquiries).values({
      id: newId(),
      serviceType: inquiry.serviceType,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone || null,
      source: inquiry.source || null,
      notes: inquiry.notes || null,
      payload: JSON.stringify(inquiry.payload),
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    // Emails are best-effort: a mail hiccup must not lose the stored lead or
    // 500 the visitor. Notify Daniel + auto-reply to the submitter.
    try {
      const env = getEnv();
      const varietyLabels = new Map(getAllVarieties().map((v) => [v.slug, v.name]));
      const rows = summarizePayload(service, inquiry.payload, varietyLabels);

      const notify = inquiryNotificationEmail({
        service,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        source: inquiry.source,
        notes: inquiry.notes,
        rows,
      });
      await sendMail({ to: env.INQUIRY_NOTIFY_EMAIL ?? env.SMTP_FROM, ...notify });

      const reply = inquiryAutoReplyEmail({ service, name: inquiry.name });
      await sendMail({ to: inquiry.email, ...reply });
    } catch (error) {
      console.error("Inquiry stored but email failed", error);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
