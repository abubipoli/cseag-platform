// POST /api/admin/newsletter/send — emails every current newsletter
// subscriber with a one-off subject/message. Separate from
// /api/admin/notifications/broadcast, which targets member/applicant
// accounts — newsletter subscribers are just email addresses with no
// account (see db/schema.ts).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { newsletterSendSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "newsletter"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = newsletterSendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const subscribers = await db.query.newsletterSubscribers.findMany();
  if (subscribers.length === 0) {
    return NextResponse.json({ error: "There are no newsletter subscribers yet." }, { status: 400 });
  }

  const results = await Promise.all(
    subscribers.map((s) =>
      notify({
        templateKey: "custom",
        email: s.email,
        data: { subject: parsed.data.subject, message: parsed.data.message },
      })
    )
  );
  const sent = results.filter((r) => r.every((c) => c.ok)).length;

  await recordAudit({
    actorUserId: session.userId,
    action: "newsletter.sent",
    details: { recipientCount: subscribers.length, sentCount: sent, subject: parsed.data.subject },
  });

  return NextResponse.json({ ok: true, sent, total: subscribers.length });
}
