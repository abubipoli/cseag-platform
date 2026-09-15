// GET /api/member/dues/:id/receipt — download the PDF receipt for one of
// the member's own successful dues payments (also reachable by staff with
// the "dues" permission, for the admin dues views). Generated on demand
// from the payment + profile rows — nothing is stored.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { duesPayments, users, memberProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPaymentSettings } from "@/lib/settings";
import { getMemberDuesSummary } from "@/lib/dues";
import { generateDuesReceiptPdf } from "@/lib/receipts";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const payment = await db.query.duesPayments.findFirst({ where: eq(duesPayments.id, id) });
  if (!payment) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const isOwner = payment.userId === session.userId;
  if (!isOwner && !(await hasPermission(session, "dues"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (payment.status !== "success") {
    return NextResponse.json({ error: "This payment has no receipt yet" }, { status: 404 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, payment.userId) });
  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, payment.userId) });
  if (!user || !profile) return NextResponse.json({ error: "Member record not found" }, { status: 404 });

  const settings = await getPaymentSettings();
  const summary = await getMemberDuesSummary(payment.userId, settings.duesAmountGhs, payment.year);

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

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="CSEAG-Dues-Receipt-${payment.year}-${payment.id.slice(0, 8)}.pdf"`,
    },
  });
}
