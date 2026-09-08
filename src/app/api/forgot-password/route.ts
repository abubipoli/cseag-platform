// POST /api/forgot-password — SRS 6.5 self-service reset via email.
// Always returns 200 regardless of whether the email exists, so the
// endpoint can't be used to enumerate registered accounts.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles } from "@/db/schema";
import { forgotPasswordSchema } from "@/lib/validation";
import { generatePasswordResetToken } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 422 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (user && user.isActive) {
    const { token, tokenHash, expiresAt } = generatePasswordResetToken();
    await db
      .update(users)
      .set({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt })
      .where(eq(users.id, user.id));

    const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, user.id) });
    const origin = req.headers.get("origin") || new URL(req.url).origin;

    await notify({
      userId: user.id,
      templateKey: "password_reset",
      email: user.email,
      data: {
        name: profile?.fullName || "there",
        resetUrl: `${origin}/reset-password?token=${token}`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
