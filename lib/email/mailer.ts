import nodemailer, { type Transporter } from "nodemailer";

import { getEnv } from "@/lib/env";

let transporter: Transporter | null = null;

/** Lazily-built, reused SMTP transport (mxroute) from env config. */
function getTransporter(): Transporter {
  if (!transporter) {
    const env = getEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // `secure` true => implicit TLS (465); false => STARTTLS upgrade (587).
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export type OutgoingMail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** Send one transactional email over SMTP. Throws on transport failure. */
export async function sendMail(mail: OutgoingMail): Promise<void> {
  const env = getEnv();
  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

/** @internal test/health helper — verifies the SMTP connection. */
export async function verifyMailer(): Promise<void> {
  await getTransporter().verify();
}
