// GET /api/admin/members/:id/dues — one member's dues status + payment
// history, for the admin Member detail drawer (super_admin only, same as
// the rest of the payments feature).

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPaymentSettings } from "@/lib/settings";
import { duesAmountForUser, getMemberDuesSummary } from "@/lib/dues";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "dues"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const settings = await getPaymentSettings();
  const summary = await getMemberDuesSummary(id, await duesAmountForUser(id, settings));

  return NextResponse.json({
    ...summary,
    payments: summary.payments.map((p) => ({
      id: p.id,
      amountGhs: p.amountGhs,
      method: p.method,
      status: p.status,
      note: p.note,
      createdAt: p.createdAt,
    })),
  });
}
