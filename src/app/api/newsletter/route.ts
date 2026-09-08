// POST /api/newsletter — SRS 6.10 "Stay Updated" subscription.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { newsletterSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 422 });
  }

  const existing = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.email, parsed.data.email),
  });
  if (!existing) {
    await db.insert(newsletterSubscribers).values({ id: randomUUID(), email: parsed.data.email });
    await notify({ templateKey: "newsletter_confirmation", email: parsed.data.email, data: {} });
  }

  return NextResponse.json({ ok: true });
}
