// GET /api/admin/dues — every member's dues status for the current year
// (super_admin only), plus an aggregate summary for reporting.

import { NextResponse } from "next/server";
import { ne } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPaymentSettings } from "@/lib/settings";
import { getAllMemberDuesSummaries, currentDuesYear } from "@/lib/dues";

export async function GET() {
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

  const rows = members.map((user) => {
    const profile = profileByUserId.get(user.id);
    const summary = summaries.get(user.id)!;
    return {
      userId: user.id,
      name: profile?.fullName || user.email,
      email: user.email,
      membershipCategory: profile?.membershipCategory || null,
      duesAmountGhs: summary.duesAmountGhs,
      totalPaidGhs: summary.totalPaidGhs,
      balanceGhs: summary.balanceGhs,
      status: summary.status,
    };
  });

  const summary = {
    year,
    duesAmountGhs: settings.duesAmountGhs,
    totalCollectedGhs: rows.reduce((sum, r) => sum + r.totalPaidGhs, 0),
    totalOutstandingGhs: rows.reduce((sum, r) => sum + r.balanceGhs, 0),
    paidCount: rows.filter((r) => r.status === "paid").length,
    partialCount: rows.filter((r) => r.status === "partial").length,
    unpaidCount: rows.filter((r) => r.status === "unpaid").length,
  };

  return NextResponse.json({ rows, summary });
}
