// GET /api/member/news — recent published "news" items for the logged-in
// member's dashboard notification bell, each flagged read/unread against
// contentReads. Members only (not applicants) — matches the dashboard's own
// gating of everything besides Overview/Security for tier-1 accounts.
import { NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems, contentReads } from "@/db/schema";
import { getSession } from "@/lib/auth";

const RECENT_LIMIT = 20;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const items = await db.query.contentItems.findMany({
    where: and(eq(contentItems.type, "news"), eq(contentItems.status, "published"), isNotNull(contentItems.publishedAt)),
    orderBy: [desc(contentItems.publishedAt)],
    limit: RECENT_LIMIT,
  });

  const reads = await db.query.contentReads.findMany({ where: eq(contentReads.userId, session.userId) });
  const readIds = new Set(reads.map((r) => r.contentId));

  const news = items.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    publishedAt: item.publishedAt,
    isRead: readIds.has(item.id),
  }));

  return NextResponse.json({ news, unreadCount: news.filter((n) => !n.isRead).length });
}
