// GET/PATCH /api/admin/settings/payments — dues amount + Paystack keys.
// Mirrors /api/admin/settings/notifications: secrets are never sent back to
// the browser, only whether one is already set; a blank field on save means
// "leave unchanged".

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/settings";
import { paymentSettingsSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "settings"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPaymentSettings();
  return NextResponse.json({
    duesAmountGhs: settings.duesAmountGhs,
    paystackPublicKey: settings.paystackPublicKey,
    paystackSecretKeySet: !!settings.paystackSecretKey,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "settings"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = paymentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  await updatePaymentSettings({
    ...(input.duesAmountGhs !== undefined ? { duesAmountGhs: input.duesAmountGhs } : {}),
    ...(input.paystackPublicKey !== undefined ? { paystackPublicKey: input.paystackPublicKey } : {}),
    ...(input.paystackSecretKey ? { paystackSecretKey: input.paystackSecretKey } : {}),
  });

  await recordAudit({
    actorUserId: session.userId,
    action: "payment_settings.updated",
    targetType: "app_settings",
    targetId: "singleton",
  });

  return NextResponse.json({ ok: true });
}
