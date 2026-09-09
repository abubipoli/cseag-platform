// POST /api/me/mfa/setup — starts (or restarts) 2FA enrollment: generates a
// new secret, saves it (mfaEnabled stays false until /verify confirms it),
// and returns the QR code + manual entry key.

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { generateMfaSecret, buildEnrollmentAssets } from "@/lib/mfa";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const secret = generateMfaSecret();
  await db.update(users).set({ mfaSecret: secret, mfaEnabled: false, mfaBackupCodes: null }).where(eq(users.id, session.userId));

  const { otpauthUrl, qrCodeDataUrl } = await buildEnrollmentAssets(secret, session.email);
  return NextResponse.json({ secret, otpauthUrl, qrCodeDataUrl });
}
