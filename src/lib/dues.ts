// Membership dues status (not enforced anywhere — members can see where they
// stand and optionally pay). A member can pay in instalments, so status is
// computed by summing every successful payment for the current dues year.

import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { duesPayments, users, memberProfiles } from "@/db/schema";
import { verifyPaystackTransaction } from "./paystack";
import { notify } from "./notifications";
import { generateDuesReceiptPdf } from "./receipts";
import { getPaymentSettings } from "./settings";

export function currentDuesYear(): string {
  return new Date().getFullYear().toString();
}

// Emails a PDF receipt for one successful payment — called once, right
// after a payment first transitions to "success" (see call sites below),
// never on every re-check of an already-settled payment. A failure here
// (e.g. SMTP misconfigured) is logged but never blocks the payment itself
// from being recorded — the money has already moved either way.
export async function sendDuesReceiptEmail(payment: typeof duesPayments.$inferSelect) {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, payment.userId) });
    const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, payment.userId) });
    if (!user || !profile) return;

    const settings = await getPaymentSettings();
    const summary = await getMemberDuesSummary(payment.userId, settings.duesAmountGhs, payment.year);
    const balanceGhs = summary.balanceGhs;

    const pdf = await generateDuesReceiptPdf({
      payment,
      member: {
        fullName: profile.fullName,
        title: profile.title,
        email: user.email,
        membershipId: profile.membershipId,
        membershipCategory: profile.membershipCategory,
      },
      duesAmountGhs: settings.duesAmountGhs,
      totalPaidGhs: summary.totalPaidGhs,
    });

    const amountLabel = `GHS ${payment.amountGhs.toLocaleString()}`;
    await notify({
      userId: user.id,
      templateKey: "dues_payment_receipt",
      email: user.email,
      data: {
        name: profile.fullName,
        amount: amountLabel,
        year: payment.year,
        balanceNote: balanceGhs > 0 ? `A balance of GHS ${balanceGhs.toLocaleString()} remains for ${payment.year}.` : "",
      },
      attachments: [{ filename: `CSEAG-Dues-Receipt-${payment.year}-${payment.id.slice(0, 8)}.pdf`, content: pdf }],
    });
  } catch (err) {
    console.error("Failed to send dues receipt email:", err);
  }
}

export type DuesStatus = "paid" | "partial" | "unpaid";

export interface DuesSummary {
  year: string;
  duesAmountGhs: number;
  totalPaidGhs: number;
  balanceGhs: number;
  status: DuesStatus;
  payments: (typeof duesPayments.$inferSelect)[];
}

// Pure calculation from an already-fetched payments array — split out so
// batch reporting (see getAllMemberDuesSummaries) can fetch every payment
// row for every member in one query instead of one round-trip per member.
export function summarizeDuesPayments(
  payments: (typeof duesPayments.$inferSelect)[],
  duesAmountGhs: number,
  year: string
): DuesSummary {
  const totalPaidGhs = payments.filter((r) => r.status === "success").reduce((sum, r) => sum + r.amountGhs, 0);
  const balanceGhs = Math.max(duesAmountGhs - totalPaidGhs, 0);
  const status: DuesStatus =
    duesAmountGhs <= 0 || totalPaidGhs >= duesAmountGhs ? "paid" : totalPaidGhs > 0 ? "partial" : "unpaid";

  return {
    year,
    duesAmountGhs,
    totalPaidGhs,
    balanceGhs,
    status,
    payments: [...payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

// Confirms one pending Paystack payment against Paystack directly and
// updates its row — shared by the checkout-redirect callback, the Paystack
// webhook, and the dues-status endpoint's own reconciliation pass below.
// A member's browser doesn't always make it back to the redirect callback
// (closed tab, lost connection, session gone idle mid-checkout), so nothing
// here should assume that route is the only way a payment gets confirmed.
//
// Returns "pending" (leaving the row untouched) rather than "failed" when
// Paystack's API itself couldn't be reached — a transient network hiccup on
// our side is not evidence the payment failed, and marking it failed would
// be a false negative on money that may have actually gone through.
export async function reconcilePaystackPayment(
  reference: string,
  secretKey: string
): Promise<"success" | "failed" | "pending" | "not_found"> {
  const payment = await db.query.duesPayments.findFirst({ where: eq(duesPayments.paystackReference, reference) });
  if (!payment) return "not_found";
  if (payment.status !== "pending") return payment.status;

  const result = await verifyPaystackTransaction({ secretKey, reference });
  if (!result.ok) return "pending";

  const status = result.success ? "success" : "failed";
  await db.update(duesPayments).set({ status }).where(eq(duesPayments.id, payment.id));
  if (status === "success") {
    await sendDuesReceiptEmail({ ...payment, status });
  }
  return status;
}

// Re-checks every one of a member's still-pending Paystack payments. Called
// whenever the member loads their dues status, so a payment that missed the
// redirect callback self-heals the next time they look at the page — no
// separate "did it go through?" step for them.
export async function reconcilePendingDuesPayments(userId: string, secretKey: string): Promise<void> {
  const pending = await db.query.duesPayments.findMany({
    where: and(eq(duesPayments.userId, userId), eq(duesPayments.status, "pending")),
  });
  for (const payment of pending) {
    if (payment.paystackReference) {
      await reconcilePaystackPayment(payment.paystackReference, secretKey);
    }
  }
}

export async function getMemberDuesSummary(
  userId: string,
  duesAmountGhs: number,
  year: string = currentDuesYear()
): Promise<DuesSummary> {
  const rows = await db.query.duesPayments.findMany({
    where: and(eq(duesPayments.userId, userId), eq(duesPayments.year, year)),
  });
  return summarizeDuesPayments(rows, duesAmountGhs, year);
}

// Every eligible member's dues summary in 2 queries total, regardless of
// member count — the per-member getMemberDuesSummary() above does one query
// PER member, which serializes badly against this app's single-connection
// DB pool (see db/client.ts) once there are 100+ members.
export async function getAllMemberDuesSummaries(
  userIds: string[],
  duesAmountGhs: number,
  year: string = currentDuesYear()
): Promise<Map<string, DuesSummary>> {
  const rows = await db.query.duesPayments.findMany({ where: eq(duesPayments.year, year) });
  const byUser = new Map<string, (typeof duesPayments.$inferSelect)[]>();
  for (const row of rows) {
    const list = byUser.get(row.userId);
    if (list) list.push(row);
    else byUser.set(row.userId, [row]);
  }
  const result = new Map<string, DuesSummary>();
  for (const userId of userIds) {
    result.set(userId, summarizeDuesPayments(byUser.get(userId) || [], duesAmountGhs, year));
  }
  return result;
}
