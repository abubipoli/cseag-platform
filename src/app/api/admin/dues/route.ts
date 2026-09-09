// GET /api/admin/dues — every member's dues status for the current year
// (super_admin only), plus an aggregate summary for reporting.

import { NextResponse } from "next/server";
import { ne, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/settings";
import { getMemberDuesSummary, currentDuesYear } from "@/lib/dues";

export async function GET() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getPaymentSettings();
  const year = currentDuesYear();

  const members = await db.query.users.findMany({ where: ne(users.role, "applicant") });
  const rows = await Promise.all(
    members.map(async (user) => {
      const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, user.id) });
      const summary = await getMemberDuesSummary(user.id, settings.duesAmountGhs, year);
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
    })
  );

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
