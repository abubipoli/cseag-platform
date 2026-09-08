// GET /api/admin/notifications — centralized notification log (SRS 6.10).
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications, memberProfiles } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: notifications.id,
      channel: notifications.channel,
      templateKey: notifications.templateKey,
      recipient: notifications.recipient,
      status: notifications.status,
      errorMessage: notifications.errorMessage,
      sentAt: notifications.sentAt,
      recipientName: memberProfiles.fullName,
    })
    .from(notifications)
    .leftJoin(memberProfiles, eq(memberProfiles.userId, notifications.userId))
    .orderBy(desc(notifications.sentAt))
    .limit(300);

  return NextResponse.json({ notifications: rows });
}
