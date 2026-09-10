// GET /api/member/dues/verify — Paystack's checkout redirects the browser
// here (callback_url from /api/member/dues/pay). Verifies the transaction
// server-side against Paystack, updates the pending payment row, then
// bounces the member back to their dashboard with a result banner.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { duesPayments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/settings";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { getBaseUrl } from "@/lib/base-url";

export async function GET(req: NextRequest) {
  const baseUrl = await getBaseUrl();
  const dashboardUrl = (result: "success" | "failed") => `${baseUrl}/dashboard?tab=dues&payment=${result}`;

  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.redirect(dashboardUrl("failed"));

  const payment = await db.query.duesPayments.findFirst({ where: eq(duesPayments.paystackReference, reference) });
  if (!payment) return NextResponse.redirect(dashboardUrl("failed"));

  // Verify and record the payment regardless of whether the member's
  // session is still alive — a Paystack checkout (card/mobile-money entry,
  // an OTP wait) can easily outlast an idle timeout or a slow browser
  // redirect back, and Paystack has already moved real money by this point.
  // The `payment` row itself is how this is tied to the right member, not
  // the current session.
  const settings = await getPaymentSettings();
  if (!settings.paystackSecretKey) return NextResponse.redirect(dashboardUrl("failed"));

  if (payment.status === "pending") {
    const result = await verifyPaystackTransaction({ secretKey: settings.paystackSecretKey, reference });
    const succeeded = result.ok && result.success;
    await db
      .update(duesPayments)
      .set({ status: succeeded ? "success" : "failed" })
      .where(eq(duesPayments.id, payment.id));
  }

  const session = await getSession();
  if (!session || session.userId !== payment.userId) return NextResponse.redirect(`${baseUrl}/login`);

  const fresh = await db.query.duesPayments.findFirst({ where: eq(duesPayments.id, payment.id) });
  return NextResponse.redirect(dashboardUrl(fresh?.status === "success" ? "success" : "failed"));
}
