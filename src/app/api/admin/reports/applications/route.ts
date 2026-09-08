// GET /api/admin/reports/applications — CSV export, applications by month.
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, memberProfiles, users } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      fullName: memberProfiles.fullName,
      email: users.email,
      membershipCategory: memberProfiles.membershipCategory,
      status: applications.status,
      submittedAt: applications.submittedAt,
      decisionAt: applications.decisionAt,
      reviewerNotes: applications.reviewerNotes,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id));

  const csv = toCsv(rows, ["fullName", "email", "membershipCategory", "status", "submittedAt", "decisionAt", "reviewerNotes"]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="cseag-applications-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
