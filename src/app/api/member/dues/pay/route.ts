// POST /api/member/dues/pay — starts a Paystack transaction for the
// logged-in member's outstanding dues balance and returns the checkout URL
// to redirect the browser to.

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { duesPayments, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getPaymentSettings } from "@/lib/settings";
import { getMemberDuesSummary, currentDuesYear } from "@/lib/dues";
import { initializePaystackTransaction } from "@/lib/paystack";
import { getBaseUrl } from "@/lib/base-url";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const settings = await getPaymentSettings();
  if (!settings.paystackPublicKey || !settings.paystackSecretKey) {
    return NextResponse.json({ error: "Online payment isn't set up yet. Please contact CSEAG." }, { status: 400 });
  }

  const summary = await getMemberDuesSummary(session.userId, settings.duesAmountGhs);
  const amountGhs = summary.balanceGhs > 0 ? summary.balanceGhs : settings.duesAmountGhs;
  if (amountGhs <= 0) {
    return NextResponse.json({ error: "There's nothing due right now." }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const reference = `dues_${randomUUID()}`;
  const baseUrl = await getBaseUrl();

  const result = await initializePaystackTransaction({
    secretKey: settings.paystackSecretKey,
    email: user.email,
    amountGhs,
    reference,
    callbackUrl: `${baseUrl}/api/member/dues/verify?reference=${encodeURIComponent(reference)}`,
  });

  if (!result.ok || !result.authorizationUrl) {
    return NextResponse.json({ error: result.error || "Couldn't start payment. Please try again." }, { status: 502 });
  }

  await db.insert(duesPayments).values({
    id: randomUUID(),
    userId: session.userId,
    year: currentDuesYear(),
    amountGhs,
    method: "paystack",
    status: "pending",
    paystackReference: reference,
  });

  return NextResponse.json({ authorizationUrl: result.authorizationUrl });
}
