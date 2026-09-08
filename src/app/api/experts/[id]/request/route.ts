// POST /api/experts/:id/request — SRS 6.8 "contact this expert", implemented
// as CSEAG actually runs it: the request never goes straight to the expert
// (their contact details are internal-only). It's logged as a ticket and
// an admin is notified; the admin follows up with the expert directly.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { memberProfiles, users, serviceRequests } from "@/db/schema";
import { serviceRequestSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";
import { SITE_CONFIG } from "@/lib/constants";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = serviceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const row = await db
    .select({ userId: users.id, fullName: memberProfiles.fullName, allow: memberProfiles.allowPublicContact })
    .from(memberProfiles)
    .innerJoin(users, eq(users.id, memberProfiles.userId))
    .where(and(eq(users.id, id), eq(users.isActive, true), ne(users.role, "applicant")))
    .limit(1);

  const expert = row[0];
  if (!expert || !expert.allow) {
    return NextResponse.json({ error: "This expert isn't accepting requests right now." }, { status: 404 });
  }

  const requestId = randomUUID();
  await db.insert(serviceRequests).values({
    id: requestId,
    expertUserId: expert.userId,
    requesterName: parsed.data.requesterName,
    requesterEmail: parsed.data.requesterEmail,
    requesterPhone: parsed.data.requesterPhone,
    message: parsed.data.message,
  });

  await notify({
    templateKey: "service_request_received_admin",
    email: SITE_CONFIG.email,
    replyTo: parsed.data.requesterEmail,
    data: {
      expertName: expert.fullName,
      fromName: parsed.data.requesterName,
      fromEmail: parsed.data.requesterEmail,
      fromPhone: parsed.data.requesterPhone || "",
      message: parsed.data.message,
    },
  });

  await recordAudit({
    action: "service_request.created",
    targetType: "service_request",
    targetId: requestId,
    details: { expertUserId: expert.userId },
  });

  return NextResponse.json({ ok: true });
}
