// GET /api/admin/content — all content items incl. drafts (SRS 6.7 / 6.9).
// POST /api/admin/content — create a news/event/resource/page item.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { contentItemSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const type = new URL(req.url).searchParams.get("type");

  const rows = type
    ? await db.query.contentItems.findMany({
        where: eq(contentItems.type, type as "news" | "event" | "resource" | "page"),
        orderBy: desc(contentItems.createdAt),
      })
    : await db.query.contentItems.findMany({ orderBy: desc(contentItems.createdAt) });

  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contentItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  const existing = await db.query.contentItems.findFirst({ where: eq(contentItems.slug, input.slug) });
  if (existing) {
    return NextResponse.json({ error: { formErrors: ["That slug is already in use."] } }, { status: 409 });
  }

  const id = randomUUID();
  await db.insert(contentItems).values({
    id,
    ...input,
    authorId: session.userId,
    publishedAt: input.status === "published" ? input.publishedAt || new Date().toISOString() : null,
  });

  await recordAudit({ actorUserId: session.userId, action: "content.created", targetType: "content_item", targetId: id });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
