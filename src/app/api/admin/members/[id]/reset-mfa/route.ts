// POST /api/admin/members/:id/reset-mfa — turns off 2FA for a member who's
// lost both their device and their backup codes (admin+, same gate as
// resetting a password on someone's behalf).

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const target = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.update(users).set({ mfaEnabled: false, mfaSecret: null, mfaBackupCodes: null }).where(eq(users.id, id));
  await recordAudit({ actorUserId: session.userId, action: "mfa.reset_by_admin", targetType: "user", targetId: id });

  return NextResponse.json({ ok: true });
}
