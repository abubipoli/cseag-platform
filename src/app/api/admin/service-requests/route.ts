// GET /api/admin/service-requests — the ticket queue (SRS 6.8, run as an
// admin-mediated request queue rather than a direct expert-to-visitor relay).
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import { serviceRequests, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!(await hasPermission(session, "serviceRequests"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignedProfile = alias(memberProfiles, "assigned_profile");

  const rows = await db
    .select({
      id: serviceRequests.id,
      expertUserId: serviceRequests.expertUserId,
      expertName: memberProfiles.fullName,
      assignedExpertUserId: serviceRequests.assignedExpertUserId,
      assignedExpertName: assignedProfile.fullName,
      assignedAt: serviceRequests.assignedAt,
      requesterName: serviceRequests.requesterName,
      requesterEmail: serviceRequests.requesterEmail,
      requesterPhone: serviceRequests.requesterPhone,
      message: serviceRequests.message,
      status: serviceRequests.status,
      adminNotes: serviceRequests.adminNotes,
      expertNotifiedAt: serviceRequests.expertNotifiedAt,
      createdAt: serviceRequests.createdAt,
    })
    .from(serviceRequests)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, serviceRequests.expertUserId))
    .leftJoin(assignedProfile, eq(assignedProfile.userId, serviceRequests.assignedExpertUserId))
    .orderBy(desc(serviceRequests.createdAt));

  return NextResponse.json({ requests: rows });
}
