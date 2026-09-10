// GET /api/member/dues/verify — Paystack's checkout redirects the browser
// here (callback_url from /api/member/dues/pay). Verifies the transaction
// server-side against Paystack, updates the pending payment row, then
// bounces the member back to their dashboard with a result banner.
//
// This is one of three places a payment can get confirmed — see
// reconcilePaystackPayment in lib/dues.ts for why none of them can be
// assumed to be the only one that runs.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { duesPayments } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/settings";
import { reconcilePaystackPayment } from "@/lib/dues";
import { getBaseUrl } from "@/lib/base-url";

export async function GET(req: NextRequest) {
  const baseUrl = await getBaseUrl();
  const dashboardUrl = (result: "success" | "failed") => `${baseUrl}/dashboard?tab=dues&payment=${result}`;

  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.redirect(dashboardUrl("failed"));

  const settings = await getPaymentSettings();
  if (!settings.paystackSecretKey) return NextResponse.redirect(dashboardUrl("failed"));

  // Verify and record the payment regardless of whether the member's
  // session is still alive — a Paystack checkout (card/mobile-money entry,
  // an OTP wait) can easily outlast an idle timeout or a slow browser
  // redirect back, and Paystack has already moved real money by this point.
  const result = await reconcilePaystackPayment(reference, settings.paystackSecretKey);
  if (result === "not_found") return NextResponse.redirect(dashboardUrl("failed"));

  const payment = await db.query.duesPayments.findFirst({ where: eq(duesPayments.paystackReference, reference) });
  const session = await getSession();
  if (!session || !payment || session.userId !== payment.userId) return NextResponse.redirect(`${baseUrl}/login`);

  return NextResponse.redirect(dashboardUrl(result === "success" ? "success" : "failed"));
}
