// DELETE /api/admin/newsletter/:id — removes one newsletter subscriber
// (e.g. an unsubscribe request that came in by email/phone rather than the
// public form).
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "newsletter"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const subscriber = await db.query.newsletterSubscribers.findFirst({ where: eq(newsletterSubscribers.id, id) });
  if (!subscriber) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
  await recordAudit({
    actorUserId: session.userId,
    action: "newsletter.unsubscribed",
    targetType: "newsletter_subscriber",
    targetId: id,
    details: { email: subscriber.email },
  });

  return NextResponse.json({ ok: true });
}
