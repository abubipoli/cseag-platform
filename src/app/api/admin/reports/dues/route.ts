// GET /api/admin/reports/dues?format=csv|xlsx|json — per-member dues export,
// super_admin only (same access level as /admin/dues itself, since this is
// financial data).
import { NextRequest, NextResponse } from "next/server";
import { ne } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPaymentSettings } from "@/lib/settings";
import { getAllMemberDuesSummaries, currentDuesYear } from "@/lib/dues";
import { reportResponse, parseReportFormat, type ReportColumn } from "@/lib/reportResponse";

interface DuesRow {
  fullName: string;
  email: string;
  membershipCategory: string | null;
  year: string;
  duesAmountGhs: number;
  totalPaidGhs: number;
  balanceGhs: number;
  status: string;
}

const COLUMNS: ReportColumn<DuesRow>[] = [
  { key: "fullName", header: "Full name" },
  { key: "email", header: "Email" },
  { key: "membershipCategory", header: "Membership category" },
  { key: "year", header: "Year" },
  { key: "duesAmountGhs", header: "Dues (GHS)" },
  { key: "totalPaidGhs", header: "Paid (GHS)" },
  { key: "balanceGhs", header: "Balance (GHS)" },
  { key: "status", header: "Status" },
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "dues"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPaymentSettings();
  const year = currentDuesYear();

  const members = await db.query.users.findMany({ where: ne(users.role, "applicant") });
  const profiles = await db.query.memberProfiles.findMany();
  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
  const summaries = await getAllMemberDuesSummaries(
    members.map((m) => m.id),
    settings.duesAmountGhs,
    year
  );

  const rows: DuesRow[] = members.map((user) => {
    const profile = profileByUserId.get(user.id);
    const summary = summaries.get(user.id)!;
    return {
      fullName: profile?.fullName || user.email,
      email: user.email,
      membershipCategory: profile?.membershipCategory || null,
      year,
      duesAmountGhs: summary.duesAmountGhs,
      totalPaidGhs: summary.totalPaidGhs,
      balanceGhs: summary.balanceGhs,
      status: summary.status,
    };
  });

  const format = parseReportFormat(req.nextUrl.searchParams.get("format"));
  return reportResponse(format, rows, COLUMNS, "cseag-dues");
}
