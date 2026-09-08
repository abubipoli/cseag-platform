// Provider selection + the functions the rest of the app calls.
//
// Which real provider gets used is controlled by the admin Settings page
// (/admin/settings), falling back to environment variables if a field is
// left unset there (see src/lib/settings.ts):
//
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//   SMS_PROVIDER=arkesel|mnotify, SMS_API_KEY, SMS_SENDER_ID
//
// Until those are set, both channels fall back to logging to the server
// console so the whole application (including the acknowledgment flow) is
// fully testable without any live vendor account. Providers are resolved
// fresh on every call (not cached at module load) so a settings change
// takes effect immediately, without a redeploy.

import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { getNotificationSettings, type NotificationSettings } from "@/lib/settings";
import { consoleEmailProvider, consoleSmsProvider } from "./providers/console";
import { createSmtpEmailProvider } from "./providers/smtp";
import { createArkeselSmsProvider } from "./providers/arkesel";
import { createMnotifySmsProvider } from "./providers/mnotify";
import type { EmailProvider, SmsProvider } from "./types";
import { renderTemplate, type TemplateKey } from "./templates";

function resolveEmailProvider(settings: NotificationSettings): EmailProvider {
  if (settings.smtpHost) {
    return createSmtpEmailProvider({
      host: settings.smtpHost,
      port: settings.smtpPort,
      user: settings.smtpUser,
      pass: settings.smtpPass,
      from: settings.smtpFrom,
    });
  }
  return consoleEmailProvider;
}

function resolveSmsProvider(settings: NotificationSettings): SmsProvider {
  switch (settings.smsProvider) {
    case "arkesel":
      return createArkeselSmsProvider({ apiKey: settings.smsApiKey, senderId: settings.smsSenderId });
    case "mnotify":
      return createMnotifySmsProvider({ apiKey: settings.smsApiKey, senderId: settings.smsSenderId });
    default:
      return consoleSmsProvider;
  }
}

interface NotifyArgs {
  userId?: string;
  templateKey: TemplateKey;
  email?: string;
  phone?: string;
  replyTo?: string;
  data: Record<string, string>;
}

/**
 * Sends a notification by email and/or SMS (whichever recipients are
 * provided) using a named template, and logs the attempt to the
 * notifications table (SRS Section 6.10 — centralized notification log).
 */
export async function notify({ userId, templateKey, email, phone, replyTo, data }: NotifyArgs) {
  const settings = await getNotificationSettings();
  const emailProvider = resolveEmailProvider(settings);
  const smsProvider = resolveSmsProvider(settings);
  const rendered = renderTemplate(templateKey, data);
  const results: { channel: "email" | "sms"; ok: boolean }[] = [];

  if (email) {
    const result = await emailProvider.send({
      to: email,
      subject: rendered.emailSubject,
      html: rendered.emailHtml,
      text: rendered.emailText,
      replyTo,
    });
    await db.insert(notifications).values({
      id: randomUUID(),
      userId,
      channel: "email",
      templateKey,
      recipient: email,
      status: result.ok ? "sent" : "failed",
      errorMessage: result.error,
      payload: JSON.stringify({ data, replyTo }),
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
      payload: JSON.stringify({ data }),
    });
    results.push({ channel: "sms", ok: result.ok });
  }

  return results;
}
