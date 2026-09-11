// GET /api/admin/audit-log — every admin action (SRS 6.7 / 7.1).
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLog, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!(await hasPermission(session, "auditLog"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      details: auditLog.details,
      createdAt: auditLog.createdAt,
      actorName: memberProfiles.fullName,
    })
    .from(auditLog)
    .leftJoin(memberProfiles, eq(memberProfiles.userId, auditLog.actorUserId))
    .orderBy(desc(auditLog.createdAt))
    .limit(300);

  return NextResponse.json({ entries: rows });
}
