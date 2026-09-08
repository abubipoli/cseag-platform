// GET /api/admin/applications — the review queue (SRS Section 6.4 / 6.7).
// Restricted to reviewer/admin/super_admin.

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, memberProfiles, users } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      applicationId: applications.id,
      status: applications.status,
      submittedAt: applications.submittedAt,
      reviewerNotes: applications.reviewerNotes,
      statementOfInterest: applications.statementOfInterest,
      supportingDocumentUrl: applications.supportingDocumentUrl,
      userId: users.id,
      email: users.email,
      fullName: memberProfiles.fullName,
      phone: memberProfiles.phone,
      membershipCategory: memberProfiles.membershipCategory,
      areasOfExpertise: memberProfiles.areasOfExpertise,
      yearsOfExperience: memberProfiles.yearsOfExperience,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id));

  return NextResponse.json({ applications: rows });
}
