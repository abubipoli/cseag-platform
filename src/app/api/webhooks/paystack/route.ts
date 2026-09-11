// POST /api/webhooks/paystack — server-to-server payment confirmation.
//
// The checkout-redirect callback (dues/verify) depends on the member's
// browser actually making it back to this app — closed tabs, lost
// connections, and idle sessions can all mean it never does, even though
// Paystack has already moved real money. This webhook is the robust
// counterpart: Paystack calls it directly, independent of the member's
// browser, whenever a transaction completes.
//
// Configure this URL as the "Webhook URL" in the Paystack dashboard
// (Settings > API Keys & Webhooks) for both Test and Live mode.
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getPaymentSettings } from "@/lib/settings";
import { reconcilePaystackPayment } from "@/lib/dues";
import { reconcileDonation } from "@/lib/donations";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 401 });

  const settings = await getPaymentSettings();
  if (!settings.paystackSecretKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const expected = createHmac("sha512", settings.paystackSecretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const reference: string | undefined = event?.data?.reference;
  if (event?.event === "charge.success" && reference) {
    // Dues and donations are separate flows with separate reference
    // prefixes (see db/schema.ts) — route to whichever this reference is.
    if (reference.startsWith("donation_")) {
      await reconcileDonation(reference, settings.paystackSecretKey);
    } else {
      await reconcilePaystackPayment(reference, settings.paystackSecretKey);
    }
  }

  // Paystack only cares about a 200 — it retries on anything else.
  return NextResponse.json({ ok: true });
}
