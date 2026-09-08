import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { contentItemSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = contentItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  const existingItem = await db.query.contentItems.findFirst({ where: eq(contentItems.id, id) });
  if (!existingItem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slugOwner = await db.query.contentItems.findFirst({ where: eq(contentItems.slug, input.slug) });
  if (slugOwner && slugOwner.id !== id) {
    return NextResponse.json({ error: { formErrors: ["That slug is already in use."] } }, { status: 409 });
  }

  await db
    .update(contentItems)
    .set({
      ...input,
      publishedAt:
        input.status === "published" ? existingItem.publishedAt || new Date().toISOString() : existingItem.publishedAt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(contentItems.id, id));

  await recordAudit({ actorUserId: session.userId, action: "content.updated", targetType: "content_item", targetId: id });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  await db.delete(contentItems).where(eq(contentItems.id, id));
  await recordAudit({ actorUserId: session.userId, action: "content.deleted", targetType: "content_item", targetId: id });

  return NextResponse.json({ ok: true });
}
