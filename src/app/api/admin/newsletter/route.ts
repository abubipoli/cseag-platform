// GET  /api/admin/newsletter — every public "Stay Updated" signup, newest
// first, plus any email an admin has added directly. These are just email
// addresses with no account attached (see db/schema.ts's
// newsletterSubscribers table) — separate from member/admin users entirely.
// POST /api/admin/newsletter — add one email directly (e.g. a contact
// collected at an event), without them going through the public form.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { newsletterSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "newsletter"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscribers = await db.query.newsletterSubscribers.findMany({
    orderBy: desc(newsletterSubscribers.subscribedAt),
  });

  return NextResponse.json({ subscribers });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "newsletter"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 422 });
  }

  const existing = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.email, parsed.data.email),
  });
  if (existing) {
    return NextResponse.json({ error: "That email is already on the list." }, { status: 409 });
  }

  const id = randomUUID();
  await db.insert(newsletterSubscribers).values({ id, email: parsed.data.email });
  await notify({ templateKey: "newsletter_confirmation", email: parsed.data.email, data: {} });
  await recordAudit({
    actorUserId: session.userId,
    action: "newsletter.subscriber_added",
    targetType: "newsletter_subscriber",
    targetId: id,
    details: { email: parsed.data.email },
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
