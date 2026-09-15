// POST /api/admin/dues/manual — record a cash/offline dues payment for a
// member (super_admin only), e.g. paid directly to the treasurer.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { duesPayments, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { manualDuesPaymentSchema } from "@/lib/validation";
import { currentDuesYear, sendDuesReceiptEmail } from "@/lib/dues";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "dues"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = manualDuesPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  const member = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const paymentId = randomUUID();
  const year = currentDuesYear();
  await db.insert(duesPayments).values({
    id: paymentId,
    userId: input.userId,
    year,
    amountGhs: input.amountGhs,
    method: "manual",
    status: "success",
    recordedBy: session.userId,
    note: input.note,
  });

  const payment = await db.query.duesPayments.findFirst({ where: eq(duesPayments.id, paymentId) });
  if (payment) await sendDuesReceiptEmail(payment);

  await recordAudit({
    actorUserId: session.userId,
    action: "dues.recorded_manually",
    targetType: "user",
    targetId: input.userId,
    details: { amountGhs: input.amountGhs, note: input.note },
  });

  return NextResponse.json({ ok: true });
}
