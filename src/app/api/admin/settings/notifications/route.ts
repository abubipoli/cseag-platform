// GET /api/admin/settings/notifications — current email/SMS provider config.
// PATCH /api/admin/settings/notifications — update it. Restricted to super
// admins since these are live credentials (SMTP password, SMS API key).
import { NextRequest, NextResponse } from "next/server";
import { getSession, roleAtLeast } from "@/lib/auth";
import { notificationSettingsSchema } from "@/lib/validation";
import { getNotificationSettings, updateNotificationSettings } from "@/lib/settings";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getNotificationSettings();
  return NextResponse.json({
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpFrom: settings.smtpFrom,
    smtpPassSet: !!settings.smtpPass,
    smsProvider: settings.smsProvider,
    smsSenderId: settings.smsSenderId,
    smsApiKeySet: !!settings.smsApiKey,
    smsApiSecretSet: !!settings.smsApiSecret,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = notificationSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  // Blank smtpPass/smsApiKey means "leave unchanged" — never accept an
  // explicit blank-out here, since that's how the form always submits when
  // the admin didn't retype a secret they can no longer see.
  const update: Record<string, string> = {};
  for (const key of ["smtpHost", "smtpPort", "smtpUser", "smtpFrom", "smsProvider", "smsSenderId"] as const) {
    if (input[key] !== undefined) update[key] = input[key] as string;
  }
  if (input.smtpPass) update.smtpPass = input.smtpPass;
  if (input.smsApiKey) update.smsApiKey = input.smsApiKey;
  if (input.smsApiSecret) update.smsApiSecret = input.smsApiSecret;

  await updateNotificationSettings(update);
  await recordAudit({ actorUserId: session.userId, action: "settings.notifications_updated", targetType: "app_settings" });

  return NextResponse.json({ ok: true });
}
