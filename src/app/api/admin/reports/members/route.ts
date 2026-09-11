// GET /api/admin/reports/members?format=csv|xlsx|json — member list export (SRS 6.7).
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { reportResponse, parseReportFormat, type ReportColumn } from "@/lib/reportResponse";

interface MemberRow {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  membershipCategory: string | null;
  region: string | null;
  employer: string | null;
  yearsOfExperience: number | null;
  createdAt: string;
}

const COLUMNS: ReportColumn<MemberRow>[] = [
  { key: "fullName", header: "Full name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "role", header: "Role" },
  { key: "status", header: "Status" },
  { key: "membershipCategory", header: "Membership category" },
  { key: "region", header: "Region" },
  { key: "employer", header: "Employer" },
  { key: "yearsOfExperience", header: "Years of experience" },
  { key: "createdAt", header: "Joined" },
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "reportsMembers"))) {
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

  const shaped: MemberRow[] = rows.map((r) => ({ ...r, status: r.status ? "active" : "inactive" }));

  const format = parseReportFormat(req.nextUrl.searchParams.get("format"));
  return reportResponse(format, shaped, COLUMNS, "cseag-members");
}
