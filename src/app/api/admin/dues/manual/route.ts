// POST /api/admin/dues/manual — record a cash/offline dues payment for a
// member (super_admin only), e.g. paid directly to the treasurer.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { duesPayments, users } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { manualDuesPaymentSchema } from "@/lib/validation";
import { currentDuesYear } from "@/lib/dues";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
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

  await db.insert(duesPayments).values({
    id: randomUUID(),
    userId: input.userId,
    year: currentDuesYear(),
    amountGhs: input.amountGhs,
    method: "manual",
    status: "success",
    recordedBy: session.userId,
    note: input.note,
  });

  await recordAudit({
    actorUserId: session.userId,
    action: "dues.recorded_manually",
    targetType: "user",
    targetId: input.userId,
    details: { amountGhs: input.amountGhs, note: input.note },
  });

  return NextResponse.json({ ok: true });
}
