// POST /api/member/news/:id/read — marks one published news item as read
// by the logged-in member. Idempotent: a repeat call for an already-read
// item is a harmless no-op (the unique index on (user_id, content_id)
// prevents a duplicate row either way).
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contentReads } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const existing = await db.query.contentReads.findFirst({
    where: and(eq(contentReads.userId, session.userId), eq(contentReads.contentId, id)),
  });
  if (!existing) {
    await db.insert(contentReads).values({ id: randomUUID(), userId: session.userId, contentId: id });
  }

  return NextResponse.json({ ok: true });
}
