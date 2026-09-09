// GET /api/member/dues/status — the logged-in member's own dues status for
// the current year, plus whether online payment is available (Paystack
// configured) so the dashboard knows whether to show a "Pay now" button.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/settings";
import { getMemberDuesSummary } from "@/lib/dues";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const settings = await getPaymentSettings();
  const summary = await getMemberDuesSummary(session.userId, settings.duesAmountGhs);

  return NextResponse.json({
    ...summary,
    payments: summary.payments.map((p) => ({
      id: p.id,
      amountGhs: p.amountGhs,
      method: p.method,
      status: p.status,
      createdAt: p.createdAt,
    })),
    paystackReady: !!(settings.paystackPublicKey && settings.paystackSecretKey),
  });
}
