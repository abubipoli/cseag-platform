// POST /api/events/:id/rsvp — SRS 6.9 event sign-up/RSVP capture.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems, eventRsvps } from "@/db/schema";
import { rsvpSchema } from "@/lib/validation";
import { getSession } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const event = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.id, id), eq(contentItems.type, "event"), eq(contentItems.status, "published")),
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // RSVP is a member-only benefit (surfaced from the member dashboard, not
  // the public event page) — enforced here too, not just by hiding the form.
  const session = await getSession();
  if (!session || session.role === "applicant") {
    return NextResponse.json({ error: "Log in as a member to RSVP for this event." }, { status: 403 });
  }

  await db.insert(eventRsvps).values({
    id: randomUUID(),
    contentItemId: event.id,
    userId: session?.userId,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
  });

  await notify({
    userId: session?.userId,
    templateKey: "event_rsvp_confirmation",
    email: parsed.data.email,
    phone: parsed.data.phone,
    data: {
      name: parsed.data.name,
      eventTitle: event.title,
      eventDate: event.eventDate || "",
      eventLocation: event.eventLocation || "",
    },
  });

  return NextResponse.json({ ok: true });
}
