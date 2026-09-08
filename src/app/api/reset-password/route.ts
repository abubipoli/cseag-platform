// POST /api/reset-password — completes the SRS 6.5 self-service reset.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { resetPasswordSchema } from "@/lib/validation";
import { hashPassword, hashResetToken } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const user = await db.query.users.findFirst({ where: eq(users.passwordResetTokenHash, tokenHash) });

  if (!user || !user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt) < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  await recordAudit({ actorUserId: user.id, action: "password.reset_self" });

  return NextResponse.json({ ok: true });
}
