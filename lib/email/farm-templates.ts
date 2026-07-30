/**
 * Transactional email templates for the Run-a-Muck Farms service site. Like the
 * MyFerment templates, these are table-based, inline-styled HTML with a plain-
 * text fallback and no external assets — the only thing that renders reliably
 * across mail clients.
 */
import type { EmailContent } from "@/lib/email/templates";
import type { ServiceDefinition } from "@/lib/request/config";
import type { SummaryRow } from "@/lib/request/summary";

const BRAND = "#5f7a3f";
const INK = "#1f2417";
const MUTED = "#6b7280";
const SURFACE = "#f6f7f2";
const FARM = "Run-a-Muck Farms";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(options: { previewText: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${FARM}</title>
  </head>
  <body style="margin:0;padding:0;background:${SURFACE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.previewText)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8df;">
            <tr>
              <td style="background:${BRAND};padding:20px 28px;">
                <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">🌾 ${FARM}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${options.body}
              </td>
            </tr>
          </table>
          <p style="max-width:520px;margin:16px auto 0;font-size:11px;color:${MUTED};text-align:center;">
            © ${FARM} · New Cumberland, PA
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function rowsToHtml(rows: SummaryRow[]): string {
  if (rows.length === 0) return "";
  const cells = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${MUTED};vertical-align:top;width:42%;">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;font-size:14px;color:${INK};font-weight:600;">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e8df;border-bottom:1px solid #e6e8df;margin:8px 0 20px;">${cells}</table>`;
}

function rowsToText(rows: SummaryRow[]): string {
  return rows.map((r) => `${r.label}: ${r.value}`).join("\n");
}

/** Notification to Daniel with the service type in the subject line (PRD §6.1). */
export function inquiryNotificationEmail(options: {
  service: ServiceDefinition;
  name: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
  rows: SummaryRow[];
}): EmailContent {
  const { service, name, email, phone, source, notes, rows } = options;
  const subject = `New ${service.label.toLowerCase()} inquiry — ${name}`;

  const contactRows: SummaryRow[] = [
    { label: "Name", value: name },
    { label: "Email", value: email },
    ...(phone ? [{ label: "Phone", value: phone }] : []),
    ...(source ? [{ label: "Heard via", value: source }] : []),
  ];

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;line-height:26px;color:${INK};">${escapeHtml(service.label)} inquiry</h1>
    <p style="margin:0 0 16px;font-size:14px;color:${MUTED};">A new request just came in through the site.</p>
    ${rowsToHtml(contactRows)}
    <h2 style="margin:0 0 4px;font-size:15px;color:${INK};">Details</h2>
    ${rowsToHtml(rows)}
    ${
      notes
        ? `<h2 style="margin:0 0 4px;font-size:15px;color:${INK};">Notes</h2><p style="margin:0 0 8px;font-size:14px;line-height:21px;color:${INK};white-space:pre-wrap;">${escapeHtml(notes)}</p>`
        : ""
    }
    <p style="margin:20px 0 0;font-size:13px;color:${MUTED};">Reply straight to <a href="mailto:${escapeHtml(email)}" style="color:${BRAND};">${escapeHtml(email)}</a> to quote.</p>`;

  const text = `New ${service.label} inquiry

${rowsToText(contactRows)}

Details
${rowsToText(rows)}
${notes ? `\nNotes\n${notes}\n` : ""}
Reply to ${email} to quote.`;

  return { subject, html: layout({ previewText: subject, body }), text };
}

/** Auto-reply to the submitter setting a response-time expectation (PRD §6.1). */
export function inquiryAutoReplyEmail(options: {
  service: ServiceDefinition;
  name: string;
}): EmailContent {
  const { service, name } = options;
  const subject = `We got your ${service.label.toLowerCase()} request`;
  const firstName = name.split(/\s+/)[0] || name;

  const body = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;color:${INK};">Thanks, ${escapeHtml(firstName)} 🌾</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:${INK};">
      Your ${escapeHtml(service.label.toLowerCase())} request landed in our inbox. Daniel reads every one himself and will
      get back to you <strong>within two business days</strong> — usually sooner.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:${INK};">
      If your timeline is tight, just reply to this email and say so and we'll bump it up.
    </p>
    <p style="margin:0;font-size:15px;line-height:22px;color:${INK};">— ${FARM}, New Cumberland, PA</p>`;

  const text = `Thanks, ${firstName}!

Your ${service.label.toLowerCase()} request landed in our inbox. Daniel reads every one himself and will get back to you within two business days — usually sooner.

If your timeline is tight, just reply to this email and say so and we'll bump it up.

— ${FARM}, New Cumberland, PA`;

  return { subject, html: layout({ previewText: subject, body }), text };
}
