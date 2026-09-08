// GET /api/admin/reports/members — CSV export (SRS 6.7 "basic reporting/export").
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles } from "@/db/schema";
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
      phone: memberProfiles.phone,
      role: users.role,
      status: users.isActive,
      membershipCategory: memberProfiles.membershipCategory,
      region: memberProfiles.region,
      employer: memberProfiles.employer,
      yearsOfExperience: memberProfiles.yearsOfExperience,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id));

  const csv = toCsv(
    rows.map((r) => ({ ...r, status: r.status ? "active" : "inactive" })),
    ["fullName", "email", "phone", "role", "status", "membershipCategory", "region", "employer", "yearsOfExperience", "createdAt"]
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="cseag-members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
