// POST /api/me/mfa/verify — confirms enrollment: checks the first code from
// the authenticator app against the pending secret from /setup, and if it
// matches, turns 2FA on and issues one-time backup codes (shown only now).

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { mfaCodeSchema } from "@/lib/validation";
import { verifyTotpCode, generateBackupCodes } from "@/lib/mfa";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = mfaCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your app" }, { status: 422 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user?.mfaSecret) {
    return NextResponse.json({ error: "Start setup again before entering a code." }, { status: 400 });
  }

  if (!verifyTotpCode(user.mfaSecret, parsed.data.code)) {
    return NextResponse.json({ error: "That code isn't valid. Check the time on your device and try again." }, { status: 400 });
  }

  const { plain, records } = generateBackupCodes();
  await db.update(users).set({ mfaEnabled: true, mfaBackupCodes: JSON.stringify(records) }).where(eq(users.id, session.userId));
  await recordAudit({ actorUserId: session.userId, action: "mfa.enabled" });

  return NextResponse.json({ ok: true, backupCodes: plain });
}
