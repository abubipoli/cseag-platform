// Provider selection + the functions the rest of the app calls.
//
// Which real provider gets used is controlled entirely by environment
// variables (see .env.example) — no code changes needed once you tell us
// which email and SMS vendors you use:
//
//   EMAIL_PROVIDER=smtp            (default if SMTP_HOST is set)
//   SMS_PROVIDER=arkesel|mnotify   (default: none — falls back to console)
//
// Until those are set, both channels fall back to logging to the server
// console so the whole application (including the acknowledgment flow) is
// fully testable without any live vendor account.

import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { consoleEmailProvider, consoleSmsProvider } from "./providers/console";
import { createSmtpEmailProvider } from "./providers/smtp";
import { createArkeselSmsProvider } from "./providers/arkesel";
import { createMnotifySmsProvider } from "./providers/mnotify";
import type { EmailProvider, SmsProvider } from "./types";
import { renderTemplate, type TemplateKey } from "./templates";

function resolveEmailProvider(): EmailProvider {
  if (process.env.SMTP_HOST) return createSmtpEmailProvider();
  return consoleEmailProvider;
}

function resolveSmsProvider(): SmsProvider {
  switch (process.env.SMS_PROVIDER) {
    case "arkesel":
      return createArkeselSmsProvider();
    case "mnotify":
      return createMnotifySmsProvider();
    default:
      return consoleSmsProvider;
  }
}

const emailProvider = resolveEmailProvider();
const smsProvider = resolveSmsProvider();

interface NotifyArgs {
  userId?: string;
  templateKey: TemplateKey;
  email?: string;
  phone?: string;
  data: Record<string, string>;
}

/**
 * Sends a notification by email and/or SMS (whichever recipients are
 * provided) using a named template, and logs the attempt to the
 * notifications table (SRS Section 6.10 — centralized notification log).
 */
export async function notify({ userId, templateKey, email, phone, data }: NotifyArgs) {
  const rendered = renderTemplate(templateKey, data);
  const results: { channel: "email" | "sms"; ok: boolean }[] = [];

  if (email) {
    const result = await emailProvider.send({
      to: email,
      subject: rendered.emailSubject,
      html: rendered.emailHtml,
      text: rendered.emailText,
    });
    await db.insert(notifications).values({
      id: randomUUID(),
      userId,
      channel: "email",
      templateKey,
      recipient: email,
      status: result.ok ? "sent" : "failed",
      errorMessage: result.error,
    });
    results.push({ channel: "email", ok: result.ok });
  }

  if (phone) {
    const result = await smsProvider.send({ to: phone, body: rendered.sms });
    await db.insert(notifications).values({
      id: randomUUID(),
      userId,
      channel: "sms",
      templateKey,
      recipient: phone,
      status: result.ok ? "sent" : "failed",
      errorMessage: result.error,
    });
    results.push({ channel: "sms", ok: result.ok });
  }

  return results;
}
