// Public donations — separate from member dues (see the schema comment on
// `donations` in db/schema.ts for why). Mirrors the reconciliation pattern
// in lib/dues.ts: a payment can be confirmed from three independent
// triggers (the checkout redirect, the webhook, or nothing at all if both
// of those miss — there's no "view status" page for a one-off donor to
// re-trigger a check the way a member's dashboard does), so the webhook is
// the one that matters most here.
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { donations } from "@/db/schema";
import { verifyPaystackTransaction } from "./paystack";

export async function reconcileDonation(
  reference: string,
  secretKey: string
): Promise<"success" | "failed" | "pending" | "not_found"> {
  const donation = await db.query.donations.findFirst({ where: eq(donations.paystackReference, reference) });
  if (!donation) return "not_found";
  if (donation.status !== "pending") return donation.status;

  const result = await verifyPaystackTransaction({ secretKey, reference });
  if (!result.ok) return "pending"; // transient API error ≠ failed payment

  const status = result.success ? "success" : "failed";
  await db.update(donations).set({ status }).where(eq(donations.id, donation.id));
  return status;
}
