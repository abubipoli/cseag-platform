// PATCH /api/admin/profile/password — lets any logged-in admin-panel user
// (reviewer, admin, or super_admin) change their own password. Deliberately
// NOT gated by the configurable permission matrix in lib/permissions.ts —
// managing your own account isn't a delegable admin capability, it's a
// baseline every admin-side user gets regardless of what they're permitted
// to do elsewhere. Requires the current password so a hijacked but
// unattended logged-in session can't be used to lock the real owner out.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSession, roleAtLeast, hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    .set({ passwordHash: await hashPassword(parsed.data.newPassword) })
    .where(eq(users.id, session.userId));

  await recordAudit({ actorUserId: session.userId, action: "profile.password_changed", targetType: "user", targetId: session.userId });

  return NextResponse.json({ ok: true });
}
