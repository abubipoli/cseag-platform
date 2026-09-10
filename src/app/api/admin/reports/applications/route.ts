// GET /api/admin/reports/applications?format=csv|xlsx|json — applications export.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, memberProfiles, users } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { reportResponse, parseReportFormat, type ReportColumn } from "@/lib/reportResponse";

interface ApplicationRow {
  fullName: string;
  email: string;
  membershipCategory: string | null;
  status: string;
  submittedAt: string;
  decisionAt: string | null;
  reviewerNotes: string | null;
}

const COLUMNS: ReportColumn<ApplicationRow>[] = [
  { key: "fullName", header: "Full name" },
  { key: "email", header: "Email" },
  { key: "membershipCategory", header: "Membership category" },
  { key: "status", header: "Status" },
  { key: "submittedAt", header: "Submitted" },
  { key: "decisionAt", header: "Decided" },
  { key: "reviewerNotes", header: "Reviewer notes" },
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows: ApplicationRow[] = await db
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

  const format = parseReportFormat(req.nextUrl.searchParams.get("format"));
  return reportResponse(format, rows, COLUMNS, "cseag-applications");
}
