// Generic SMTP email provider (works with Google Workspace, Zoho Mail,
// Microsoft 365, or any transactional email service that exposes SMTP —
// which covers the large majority of providers). Configured either via env
// vars or the admin Settings page (src/lib/settings.ts resolves both).
//
// If you use a provider with its own HTTP API instead (e.g. SendGrid,
// Mailgun, Postmark, Resend) and want to use their API rather than SMTP,
// add a sibling file here (e.g. sendgrid.ts) implementing EmailProvider and
// select it in ../index.ts — the rest of the app does not need to change.

import nodemailer from "nodemailer";
import type { EmailProvider, EmailMessage, SendResult } from "../types";

export function createSmtpEmailProvider(config: {
  host: string;
  port: string;
  user: string;
  pass: string;
  from: string;
}): EmailProvider {
  const port = Number(config.port || 587);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port,
    secure: port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  return {
    name: `smtp (${config.host})`,
    async send(message: EmailMessage): Promise<SendResult> {
      try {
        const info = await transporter.sendMail({
          from: config.from || config.user,
          to: message.to,
          replyTo: message.replyTo,
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
