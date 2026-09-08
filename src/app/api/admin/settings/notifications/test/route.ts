// POST /api/admin/settings/notifications/test — sends a live test email
// (to the admin's own account email) and, if a phone number is supplied, a
// test SMS, using whatever settings are currently saved/active. Lets an
// admin confirm credentials work before relying on them for real
// notifications.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, roleAtLeast } from "@/lib/auth";
import { getNotificationSettings } from "@/lib/settings";
import { consoleEmailProvider, consoleSmsProvider } from "@/lib/notifications/providers/console";
import { createSmtpEmailProvider } from "@/lib/notifications/providers/smtp";
import { createArkeselSmsProvider } from "@/lib/notifications/providers/arkesel";
import { createMnotifySmsProvider } from "@/lib/notifications/providers/mnotify";

const testSchema = z.object({ phone: z.string().optional() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { phone } = testSchema.parse(body || {});
  const settings = await getNotificationSettings();

  const emailProvider = settings.smtpHost
    ? createSmtpEmailProvider({
        host: settings.smtpHost,
        port: settings.smtpPort,
        user: settings.smtpUser,
        pass: settings.smtpPass,
        from: settings.smtpFrom,
      })
    : consoleEmailProvider;

  const emailResult = await emailProvider.send({
    to: session.email,
    subject: "CSEAG notification settings — test email",
    text: "This is a test message confirming your CSEAG email settings are working.",
    html: "<p>This is a test message confirming your CSEAG email settings are working.</p>",
  });

  let smsResult: { ok: boolean; error?: string } | null = null;
  if (phone) {
    const smsProvider =
      settings.smsProvider === "arkesel"
        ? createArkeselSmsProvider({ apiKey: settings.smsApiKey, senderId: settings.smsSenderId })
        : settings.smsProvider === "mnotify"
          ? createMnotifySmsProvider({ apiKey: settings.smsApiKey, senderId: settings.smsSenderId })
          : consoleSmsProvider;
    smsResult = await smsProvider.send({ to: phone, body: "CSEAG notification settings test message." });
  }

  return NextResponse.json({
    email: { ok: emailResult.ok, error: emailResult.error, usedConsoleFallback: !settings.smtpHost },
    sms: smsResult
      ? { ok: smsResult.ok, error: smsResult.error, usedConsoleFallback: !settings.smsProvider }
      : null,
  });
}
