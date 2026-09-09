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

export async function getMemberDuesSummary(
  userId: string,
  duesAmountGhs: number,
  year: string = currentDuesYear()
): Promise<DuesSummary> {
  const rows = await db.query.duesPayments.findMany({
    where: and(eq(duesPayments.userId, userId), eq(duesPayments.year, year)),
  });
  const totalPaidGhs = rows.filter((r) => r.status === "success").reduce((sum, r) => sum + r.amountGhs, 0);
  const balanceGhs = Math.max(duesAmountGhs - totalPaidGhs, 0);
  const status: DuesStatus =
    duesAmountGhs <= 0 || totalPaidGhs >= duesAmountGhs ? "paid" : totalPaidGhs > 0 ? "partial" : "unpaid";

  return {
    year,
    duesAmountGhs,
    totalPaidGhs,
    balanceGhs,
    status,
    payments: [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
