// GET /api/member/news — recent published "news" items for the logged-in
// user's dashboard notification bell, filtered by the same public/member/
// category audience rules as the public site (see lib/content.ts), and each
// flagged read/unread against contentReads. Applicants see public news only,
// same as an anonymous visitor, since they aren't a member category yet.
import { NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems, contentReads } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getViewer, isNewsVisibleToViewer } from "@/lib/content";

const RECENT_LIMIT = 20;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const viewer = await getViewer();
  const items = await db.query.contentItems.findMany({
    where: and(eq(contentItems.type, "news"), eq(contentItems.status, "published"), isNotNull(contentItems.publishedAt)),
    orderBy: [desc(contentItems.publishedAt)],
    limit: RECENT_LIMIT,
  });
  const visibleItems = items.filter((item) => isNewsVisibleToViewer(item, viewer));

  const reads = await db.query.contentReads.findMany({ where: eq(contentReads.userId, session.userId) });
  const readIds = new Set(reads.map((r) => r.contentId));

  const news = visibleItems.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    publishedAt: item.publishedAt,
    isRead: readIds.has(item.id),
  }));

  return NextResponse.json({ news, unreadCount: news.filter((n) => !n.isRead).length });
}
