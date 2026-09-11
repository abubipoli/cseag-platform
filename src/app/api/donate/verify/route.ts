// GET /api/donate/verify — Paystack's checkout redirects the browser here
// (callback_url from /api/donate). Verifies the transaction server-side
// against Paystack, updates the pending donation row, then sends the donor
// to a thank-you page. No session involved anywhere in this route — a
// donor is never required to be logged in.
import { NextRequest, NextResponse } from "next/server";
import { getPaymentSettings } from "@/lib/settings";
import { reconcileDonation } from "@/lib/donations";
import { getBaseUrl } from "@/lib/base-url";

export async function GET(req: NextRequest) {
  const baseUrl = await getBaseUrl();
  const resultUrl = (result: "success" | "failed") => `${baseUrl}/donate/thank-you?status=${result}`;

  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.redirect(resultUrl("failed"));

  const settings = await getPaymentSettings();
  if (!settings.paystackSecretKey) return NextResponse.redirect(resultUrl("failed"));

  const result = await reconcileDonation(reference, settings.paystackSecretKey);
  return NextResponse.redirect(resultUrl(result === "success" ? "success" : "failed"));
}
