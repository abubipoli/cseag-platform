// GET /api/admin/members/:id/dues — one member's dues status + payment
// history, for the admin Member detail drawer (super_admin only, same as
// the rest of the payments feature).

import { NextRequest, NextResponse } from "next/server";
import { getSession, roleAtLeast } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/settings";
import { getMemberDuesSummary } from "@/lib/dues";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const settings = await getPaymentSettings();
  const summary = await getMemberDuesSummary(id, settings.duesAmountGhs);

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
