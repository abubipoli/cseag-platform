// GET /api/admin/analytics — site-visit stats: totals, a daily trend, top
// pages/countries/referrers, and a recent-visits feed. All aggregation
// happens in SQL rather than pulling raw rows into JS, since site_visits
// grows unboundedly over time.
import { NextResponse } from "next/server";
import { sql, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { siteVisits, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "analytics"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totals, todayCount, uniqueVisitors, byDay, topPages, topCountries, topReferrers, recentRaw] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(siteVisits),
    db
      .select({ count: sql<number>`count(*)` })
      .from(siteVisits)
      .where(sql`${siteVisits.createdAt} >= to_char(now(), 'YYYY-MM-DD')`),
    db.select({ count: sql<number>`count(distinct coalesce(${siteVisits.userId}, ${siteVisits.ip}))` }).from(siteVisits),
    db
      .select({ day: sql<string>`substr(${siteVisits.createdAt}, 1, 10)`, count: sql<number>`count(*)` })
      .from(siteVisits)
      .groupBy(sql`substr(${siteVisits.createdAt}, 1, 10)`)
      .orderBy(sql`substr(${siteVisits.createdAt}, 1, 10) desc`)
      .limit(14),
    db
      .select({ path: siteVisits.path, count: sql<number>`count(*)` })
      .from(siteVisits)
      .groupBy(siteVisits.path)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db
      .select({ country: siteVisits.country, count: sql<number>`count(*)` })
      .from(siteVisits)
      .where(sql`${siteVisits.country} is not null`)
      .groupBy(siteVisits.country)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db
      .select({ referrer: siteVisits.referrer, count: sql<number>`count(*)` })
      .from(siteVisits)
      .where(sql`${siteVisits.referrer} is not null and ${siteVisits.referrer} != ''`)
      .groupBy(siteVisits.referrer)
      .orderBy(desc(sql`count(*)`))
      .limit(10),
    db
      .select({
        id: siteVisits.id,
        path: siteVisits.path,
        country: siteVisits.country,
        city: siteVisits.city,
        userAgent: siteVisits.userAgent,
        createdAt: siteVisits.createdAt,
        userId: siteVisits.userId,
        visitorName: memberProfiles.fullName,
      })
      .from(siteVisits)
      .leftJoin(memberProfiles, eq(memberProfiles.userId, siteVisits.userId))
      .orderBy(desc(siteVisits.createdAt))
      .limit(50),
  ]);

  return NextResponse.json({
    totalVisits: totals[0].count,
    todayVisits: todayCount[0].count,
    uniqueVisitors: uniqueVisitors[0].count,
    byDay,
    topPages,
    topCountries,
    topReferrers,
    recent: recentRaw,
  });
}
