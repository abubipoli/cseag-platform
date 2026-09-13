// PATCH /api/member/change-password — lets any logged-in account (any role)
// change their own password. Used both for the forced first-login change
// after a bulk/admin-issued temporary password, and for a member changing
// their password voluntarily. Requires the current password so a hijacked
// but unattended session can't be used to lock the real owner out — this
// matters especially right after a bulk reset, where many accounts briefly
// share the same starting password.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const currentOk = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!currentOk) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword), mustChangePassword: false })
    .where(eq(users.id, session.userId));

  await recordAudit({ actorUserId: session.userId, action: "password.changed", targetType: "user", targetId: session.userId });

  return NextResponse.json({ ok: true, role: user.role });
}
