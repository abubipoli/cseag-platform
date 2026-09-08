// GET /api/admin/stats — dashboard counts (SRS 6.7).
import { NextResponse } from "next/server";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, users, memberProfiles, newsletterSubscribers, auditLog, serviceRequests } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalMembers,
    activeMembers,
    pendingApplications,
    approvedThisMonth,
    rejectedApplications,
    newsletterCount,
    openServiceRequests,
    recentActivity,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).where(ne(users.role, "applicant")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(ne(users.role, "applicant"), eq(users.isActive, true))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(sql`${applications.status} in ('pending', 'more_info_requested')`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(and(eq(applications.status, "approved"), gte(applications.decisionAt, startOfMonth.toISOString()))),
    db.select({ count: sql<number>`count(*)` }).from(applications).where(eq(applications.status, "rejected")),
    db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers),
    db
      .select({ count: sql<number>`count(*)` })
      .from(serviceRequests)
      .where(sql`${serviceRequests.status} not in ('resolved', 'declined')`),
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        createdAt: auditLog.createdAt,
        actorName: memberProfiles.fullName,
      })
      .from(auditLog)
      .leftJoin(memberProfiles, eq(memberProfiles.userId, auditLog.actorUserId))
      .orderBy(sql`${auditLog.createdAt} desc`)
      .limit(8),
  ]);

  return NextResponse.json({
    totalMembers: totalMembers[0].count,
    activeMembers: activeMembers[0].count,
    pendingApplications: pendingApplications[0].count,
    approvedThisMonth: approvedThisMonth[0].count,
    rejectedApplications: rejectedApplications[0].count,
    newsletterSubscribers: newsletterCount[0].count,
    openServiceRequests: openServiceRequests[0].count,
    recentActivity,
  });
}
