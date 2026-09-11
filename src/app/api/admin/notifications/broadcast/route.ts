// POST /api/admin/notifications/broadcast — bulk/targeted email or SMS to
// members or applicants (SRS 6.7 "communication tools").
import { NextRequest, NextResponse } from "next/server";
import { inArray, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { broadcastSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "communications"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  let recipientFilter;
  if (input.audience === "all_members") recipientFilter = ne(users.role, "applicant");
  else if (input.audience === "applicants") recipientFilter = eq(users.role, "applicant");
  else if (input.audience === "reviewers_admins") recipientFilter = inArray(users.role, ["reviewer", "admin", "super_admin"]);
  else recipientFilter = input.customUserIds?.length ? inArray(users.id, input.customUserIds) : eq(users.id, "__none__");

  const recipients = await db
    .select({ id: users.id, email: users.email, phone: memberProfiles.phone, fullName: memberProfiles.fullName, isActive: users.isActive })
    .from(users)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
    .where(recipientFilter);

  const active = recipients.filter((r) => r.isActive);

  await Promise.all(
    active.map((r) =>
      notify({
        userId: r.id,
        templateKey: "custom",
        email: input.channel !== "sms" ? r.email : undefined,
        phone: input.channel !== "email" ? r.phone : undefined,
        data: { subject: input.subject, message: input.message.replace("{{name}}", r.fullName) },
      })
    )
  );

  await recordAudit({
    actorUserId: session.userId,
    action: "communication.broadcast",
    details: { audience: input.audience, channel: input.channel, recipientCount: active.length, subject: input.subject },
  });

  return NextResponse.json({ ok: true, sent: active.length });
}
