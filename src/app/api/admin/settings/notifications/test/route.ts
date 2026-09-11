// POST /api/admin/settings/notifications/test — sends a live test email
// (to the admin's own account email) and, if a phone number is supplied, a
// test SMS, using whatever settings are currently saved/active. Lets an
// admin confirm credentials work before relying on them for real
// notifications.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getNotificationSettings } from "@/lib/settings";
import { resolveEmailProvider, resolveSmsProvider } from "@/lib/notifications";

const testSchema = z.object({ phone: z.string().optional() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "settings"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { phone } = testSchema.parse(body || {});
  const settings = await getNotificationSettings();

  const emailProvider = resolveEmailProvider(settings);
  const emailResult = await emailProvider.send({
    to: session.email,
    subject: "CSEAG notification settings — test email",
    text: "This is a test message confirming your CSEAG email settings are working.",
    html: "<p>This is a test message confirming your CSEAG email settings are working.</p>",
  });

  let smsResult: { ok: boolean; error?: string } | null = null;
  if (phone) {
    const smsProvider = resolveSmsProvider(settings);
    smsResult = await smsProvider.send({ to: phone, body: "CSEAG notification settings test message." });
  }

  return NextResponse.json({
    email: { ok: emailResult.ok, error: emailResult.error, usedConsoleFallback: !settings.smtpHost },
    sms: smsResult
      ? { ok: smsResult.ok, error: smsResult.error, usedConsoleFallback: !settings.smsProvider }
      : null,
  });
}
