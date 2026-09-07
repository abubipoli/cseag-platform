// Generic SMTP email provider (works with Google Workspace, Zoho Mail,
// Microsoft 365, or any transactional email service that exposes SMTP —
// which covers the large majority of providers). Configure via env vars:
//
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//
// If you use a provider with its own HTTP API instead (e.g. SendGrid,
// Mailgun, Postmark, Resend) and want to use their API rather than SMTP,
// add a sibling file here (e.g. sendgrid.ts) implementing EmailProvider and
// select it in ../index.ts — the rest of the app does not need to change.

import nodemailer from "nodemailer";
import type { EmailProvider, EmailMessage, SendResult } from "../types";

export function createSmtpEmailProvider(): EmailProvider {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return {
    name: `smtp (${process.env.SMTP_HOST})`,
    async send(message: EmailMessage): Promise<SendResult> {
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });
        return { ok: true, providerMessageId: info.messageId };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  };
}
