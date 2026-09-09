// POST /api/login/verify-mfa — the second step of login for accounts with
// 2FA enabled. Takes the short-lived mfaToken from /api/login plus a 6-digit
// authenticator code (or a one-time backup code), and only then issues the
// real session cookie.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { mfaLoginVerifySchema } from "@/lib/validation";
import { verifyMfaChallenge, setSessionCookie } from "@/lib/auth";
import { verifyTotpCode, consumeBackupCode, type BackupCodeRecord } from "@/lib/mfa";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = mfaLoginVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your authentication code" }, { status: 422 });
  }

  const challenge = verifyMfaChallenge(parsed.data.mfaToken);
  if (!challenge) {
    return NextResponse.json({ error: "That login attempt has expired. Please log in again." }, { status: 401 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, challenge.userId) });
  if (!user || !user.isActive || !user.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ error: "Invalid request" }, { status: 401 });
  }

  let usedBackupCode = false;
  let ok = verifyTotpCode(user.mfaSecret, parsed.data.code);

  if (!ok && user.mfaBackupCodes) {
    const records: BackupCodeRecord[] = JSON.parse(user.mfaBackupCodes);
    const updated = consumeBackupCode(records, parsed.data.code);
    if (updated) {
      ok = true;
      usedBackupCode = true;
      await db.update(users).set({ mfaBackupCodes: JSON.stringify(updated) }).where(eq(users.id, user.id));
    }
  }

  if (!ok) {
    await recordAudit({ actorUserId: user.id, action: "login.mfa_failed" });
    return NextResponse.json({ error: "That code isn't valid." }, { status: 401 });
  }

  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id));
  await setSessionCookie({ userId: user.id, role: user.role, email: user.email });
  await recordAudit({ actorUserId: user.id, action: usedBackupCode ? "login.success_via_backup_code" : "login.success" });

  return NextResponse.json({ ok: true, role: user.role });
}
