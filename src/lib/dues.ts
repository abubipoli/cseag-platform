// Membership dues status (not enforced anywhere — members can see where they
// stand and optionally pay). A member can pay in instalments, so status is
// computed by summing every successful payment for the current dues year.

import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { duesPayments } from "@/db/schema";

export function currentDuesYear(): string {
  return new Date().getFullYear().toString();
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
