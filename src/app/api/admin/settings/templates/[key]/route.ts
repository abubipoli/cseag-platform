// PATCH /api/admin/settings/templates/:key — save (or partially reset, by
// leaving a field blank) one notification template's override wording.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { notificationTemplateUpdateSchema } from "@/lib/validation";
import { setTemplateOverride } from "@/lib/notifications/store";
import { TEMPLATE_LABELS } from "@/lib/notifications/templates";
import type { TemplateKey } from "@/lib/notifications/templates";
import { recordAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "settings"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key } = await params;
  if (!(key in TEMPLATE_LABELS)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = notificationTemplateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  await setTemplateOverride(key as TemplateKey, {
    emailSubject: input.emailSubject?.trim() || null,
    emailBody: input.emailBody?.trim() || null,
    smsBody: input.smsBody?.trim() || null,
  });

  await recordAudit({
    actorUserId: session.userId,
    action: "notification_template.updated",
    targetType: "notification_template",
    targetId: key,
  });

  return NextResponse.json({ ok: true });
}
