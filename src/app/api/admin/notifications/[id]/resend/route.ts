// POST /api/admin/notifications/:id/resend — manual resend of a failed
// delivery (SRS 6.3: "delivery failures... visible to administrators, with
// a manual resend option").
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import type { TemplateKey } from "@/lib/notifications/templates";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const original = await db.query.notifications.findFirst({ where: eq(notifications.id, id) });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let payload: { data?: Record<string, string>; replyTo?: string } = {};
  try {
    payload = original.payload ? JSON.parse(original.payload) : {};
  } catch {
    payload = {};
  }

  await notify({
    userId: original.userId || undefined,
    templateKey: original.templateKey as TemplateKey,
    email: original.channel === "email" ? original.recipient : undefined,
    phone: original.channel === "sms" ? original.recipient : undefined,
    replyTo: payload.replyTo,
    data: payload.data || {},
  });

  return NextResponse.json({ ok: true });
}
