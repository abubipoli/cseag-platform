// POST /api/donate — starts a Paystack transaction for a one-off public
// donation and returns the checkout URL to redirect the browser to.
// Deliberately open to anyone, no session required — a donor doesn't need
// (and often won't have) a CSEAG account. See db/schema.ts's comment on
// `donations` for why this is a separate flow from member dues.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { donations } from "@/db/schema";
import { getPaymentSettings } from "@/lib/settings";
import { initializePaystackTransaction } from "@/lib/paystack";
import { getBaseUrl } from "@/lib/base-url";
import { donationSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = donationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  if (parsed.data.website) {
    // Honeypot tripped — pretend success so a bot doesn't learn to adjust.
    return NextResponse.json({ authorizationUrl: null });
  }

  const settings = await getPaymentSettings();
  if (!settings.paystackPublicKey || !settings.paystackSecretKey) {
    return NextResponse.json({ error: "Online donations aren't set up yet. Please contact CSEAG." }, { status: 400 });
  }

  const { fullName, email, amountGhs, message } = parsed.data;
  const reference = `donation_${randomUUID()}`;
  const baseUrl = await getBaseUrl();

  const result = await initializePaystackTransaction({
    secretKey: settings.paystackSecretKey,
    email,
    amountGhs,
    reference,
    callbackUrl: `${baseUrl}/api/donate/verify?reference=${encodeURIComponent(reference)}`,
  });

  if (!result.ok || !result.authorizationUrl) {
    return NextResponse.json({ error: result.error || "Couldn't start the donation. Please try again." }, { status: 502 });
  }

  await db.insert(donations).values({
    id: randomUUID(),
    fullName,
    email,
    amountGhs,
    status: "pending",
    paystackReference: reference,
    message: message || null,
  });

  return NextResponse.json({ authorizationUrl: result.authorizationUrl });
}
