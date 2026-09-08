// GET /api/content?type=news|event|resource — public, published-only listing
// (SRS 6.9). Member-only resources are included with a flag but the caller
// is expected to gate access; download links for gated items should not be
// rendered to non-members by the page itself.
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems, CONTENT_TYPES } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const session = await getSession();
  const isMember = !!session && session.role !== "applicant";

  const conditions = [eq(contentItems.status, "published")];
  if (type && (CONTENT_TYPES as readonly string[]).includes(type)) {
    conditions.push(eq(contentItems.type, type as (typeof CONTENT_TYPES)[number]));
  }

  const rows = await db
    .select()
    .from(contentItems)
    .where(and(...conditions))
    .orderBy(desc(contentItems.publishedAt), desc(contentItems.createdAt));

  const shaped = rows.map((r) => ({
    ...r,
    fileUrl: r.isMemberOnly && !isMember ? null : r.fileUrl,
  }));

  return NextResponse.json({ items: shaped });
}
