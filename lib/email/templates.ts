/**
 * Transactional email templates for MyFerment. Emails use table-based, inline-
 * styled HTML (the only thing that renders reliably across mail clients) plus a
 * plaintext fallback. Keep them self-contained — no external CSS or images.
 */

const BRAND = "#5f7a3f";
const INK = "#1f2417";
const MUTED = "#6b7280";
const SURFACE = "#f6f7f2";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap body markup in a centered, responsive email shell. */
function layout(options: { previewText: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>MyFerment</title>
  </head>
  <body style="margin:0;padding:0;background:${SURFACE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.previewText)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8df;">
            <tr>
              <td style="background:${BRAND};padding:20px 28px;">
                <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">🫙 MyFerment</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${options.body}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <hr style="border:none;border-top:1px solid #e6e8df;margin:0 0 16px;" />
                <p style="margin:0;font-size:12px;line-height:18px;color:${MUTED};">
                  You're receiving this because someone entered this address at
                  <a href="https://myferment.com" style="color:${BRAND};text-decoration:none;">myferment.com</a>.
                  If it wasn't you, you can safely ignore this email — no one can sign in without the link above.
                </p>
              </td>
            </tr>
          </table>
          <p style="max-width:480px;margin:16px auto 0;font-size:11px;color:${MUTED};text-align:center;">
            © MyFerment · Field logbook for fermentation
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

/** The magic-link sign-in email. */
export function magicLinkEmail(options: {
  url: string;
  expiresMinutes: number;
}): EmailContent {
  const { url, expiresMinutes } = options;
  const safeUrl = escapeHtml(url);
  const subject = "Your MyFerment sign-in link";

  const body = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;color:${INK};">Sign in to MyFerment</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:${INK};">
      Tap the button below to sign in. This link works once and expires in
      ${expiresMinutes} minutes.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center" style="border-radius:12px;background:${BRAND};">
          <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
            Sign in to MyFerment
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:${MUTED};">
      If the button doesn't work, copy and paste this URL into your browser:
    </p>
    <p style="margin:0;font-size:13px;line-height:20px;word-break:break-all;">
      <a href="${safeUrl}" style="color:${BRAND};text-decoration:underline;">${safeUrl}</a>
    </p>`;

  const text = `Sign in to MyFerment

Use the link below to sign in. It works once and expires in ${expiresMinutes} minutes.

${url}

If you didn't request this, you can safely ignore this email — no one can sign in without this link.

— MyFerment`;

  return { subject, html: layout({ previewText: subject, body }), text };
}
