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
  const session = await getSession();
  if (!session) return NextResponse.redirect(`${baseUrl}/login`);

  const reference = req.nextUrl.searchParams.get("reference");
  const dashboardUrl = (result: "success" | "failed") => `${baseUrl}/dashboard?tab=dues&payment=${result}`;
  if (!reference) return NextResponse.redirect(dashboardUrl("failed"));

  const payment = await db.query.duesPayments.findFirst({ where: eq(duesPayments.paystackReference, reference) });
  if (!payment || payment.userId !== session.userId) return NextResponse.redirect(dashboardUrl("failed"));

  const settings = await getPaymentSettings();
  if (!settings.paystackSecretKey) return NextResponse.redirect(dashboardUrl("failed"));

  const result = await verifyPaystackTransaction({ secretKey: settings.paystackSecretKey, reference });
  const succeeded = result.ok && result.success;

  await db
    .update(duesPayments)
    .set({ status: succeeded ? "success" : "failed" })
    .where(eq(duesPayments.id, payment.id));

  return NextResponse.redirect(dashboardUrl(succeeded ? "success" : "failed"));
}
