// POST /api/me/mfa/disable — turns 2FA off. Requires a current code (or a
// backup code) so a bare stolen session can't casually be used to weaken
// the account.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { mfaCodeSchema } from "@/lib/validation";
import { verifyTotpCode, consumeBackupCode, type BackupCodeRecord } from "@/lib/mfa";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = mfaCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your current code to confirm" }, { status: 422 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user?.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ error: "2FA isn't enabled." }, { status: 400 });
  }

  let ok = verifyTotpCode(user.mfaSecret, parsed.data.code);
  if (!ok && user.mfaBackupCodes) {
    const records: BackupCodeRecord[] = JSON.parse(user.mfaBackupCodes);
    ok = consumeBackupCode(records, parsed.data.code) !== null;
  }
  if (!ok) {
    return NextResponse.json({ error: "That code isn't valid." }, { status: 400 });
  }

  await db.update(users).set({ mfaEnabled: false, mfaSecret: null, mfaBackupCodes: null }).where(eq(users.id, session.userId));
  await recordAudit({ actorUserId: session.userId, action: "mfa.disabled" });

  return NextResponse.json({ ok: true });
}
