// POST /api/unsubscribe — removes one newsletter subscriber by id. Public
// and unauthenticated on purpose (a recipient clicking a link in an email
// has no session), and deliberately never says "not found" vs "already
// removed" differently — either way the end state the visitor wants
// (not on the list) is already true.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const subscriber = await db.query.newsletterSubscribers.findFirst({ where: eq(newsletterSubscribers.id, id) });
  if (subscriber) {
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
    await recordAudit({
      action: "newsletter.unsubscribed",
      targetType: "newsletter_subscriber",
      targetId: id,
      details: { email: subscriber.email },
    });
  }

  return NextResponse.json({ ok: true });
}
