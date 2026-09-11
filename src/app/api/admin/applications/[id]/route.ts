// PATCH /api/admin/applications/:id — approve / reject / request more info
// (SRS Section 6.4). Approval upgrades the applicant's role from
// "applicant" to "member" and triggers the approval email + SMS; rejection
// deactivates the account; more-info keeps them at tier 1 with a note.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, users, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { decisionSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "applications"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { decision, notes } = parsed.data;

  const application = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const applicantUser = await db.query.users.findFirst({ where: eq(users.id, application.userId) });
  const applicantProfile = await db.query.memberProfiles.findFirst({
    where: eq(memberProfiles.userId, application.userId),
  });
  if (!applicantUser || !applicantProfile) {
    return NextResponse.json({ error: "Applicant record not found" }, { status: 404 });
  }

  await db
    .update(applications)
    .set({
      status: decision,
      reviewerId: session.userId,
      reviewerNotes: notes,
      decisionAt: new Date().toISOString(),
    })
    .where(eq(applications.id, id));

  if (decision === "approved") {
    await db.update(users).set({ role: "member" }).where(eq(users.id, applicantUser.id));
    await notify({
      userId: applicantUser.id,
      templateKey: "application_approved",
      email: applicantUser.email,
      phone: applicantProfile.phone,
      data: { name: applicantProfile.fullName },
    });
  } else if (decision === "rejected") {
    await db.update(users).set({ isActive: false }).where(eq(users.id, applicantUser.id));
    await notify({
      userId: applicantUser.id,
      templateKey: "application_rejected",
      email: applicantUser.email,
      phone: applicantProfile.phone,
      data: { name: applicantProfile.fullName, reason: notes || "" },
    });
  } else {
    await notify({
      userId: applicantUser.id,
      templateKey: "application_more_info",
      email: applicantUser.email,
      phone: applicantProfile.phone,
      data: { name: applicantProfile.fullName, request: notes || "" },
    });
  }

  await recordAudit({
    actorUserId: session.userId,
    action: `application.${decision}`,
    targetType: "application",
    targetId: id,
    details: { notes },
  });

  return NextResponse.json({ ok: true });
}
