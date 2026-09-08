// GET /api/admin/members/:id — full record (admins see everything,
// regardless of the member's public/private choices — SRS 6.6).
// PATCH /api/admin/members/:id — deactivate/reinstate, change role/category,
// or reset the member's password on their behalf (SRS 6.5 / 6.7).
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles, applications } from "@/db/schema";
import { getSession, roleAtLeast, generateTemporaryPassword, hashPassword } from "@/lib/auth";
import { adminMemberUpdateSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, id) });
  const applicationHistory = await db.query.applications.findMany({ where: eq(applications.userId, id) });

  if (!user || !profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, isActive: user.isActive, lastLoginAt: user.lastLoginAt },
    profile,
    applications: applicationHistory,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = adminMemberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  const target = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (input.role && (input.role === "admin" || input.role === "super_admin") && !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Only a super admin can grant administrator access." }, { status: 403 });
  }
  if (!roleAtLeast(session.role, "admin") && (input.role || input.isActive !== undefined || input.email)) {
    return NextResponse.json({ error: "Reviewers can view members but not change role, status, or email." }, { status: 403 });
  }

  if (input.email && input.email !== target.email) {
    const emailOwner = await db.query.users.findFirst({ where: eq(users.email, input.email) });
    if (emailOwner && emailOwner.id !== id) {
      return NextResponse.json({ error: "That email address is already in use by another account." }, { status: 409 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (input.role) updates.role = input.role;
  if (input.isActive !== undefined) updates.isActive = input.isActive;
  if (input.email) updates.email = input.email;
  if (Object.keys(updates).length > 0) {
    await db.update(users).set(updates).where(eq(users.id, id));
  }
  if (input.membershipCategory) {
    await db.update(memberProfiles).set({ membershipCategory: input.membershipCategory }).where(eq(memberProfiles.userId, id));
  }

  if (input.resetPassword) {
    const tempPassword = generateTemporaryPassword();
    await db.update(users).set({ passwordHash: await hashPassword(tempPassword) }).where(eq(users.id, id));
    const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, id) });
    await notify({
      userId: id,
      templateKey: "password_reset_by_admin",
      email: target.email,
      phone: profile?.phone,
      data: { name: profile?.fullName || "there", tempPassword },
    });
  }

  await recordAudit({
    actorUserId: session.userId,
    action: "member.updated",
    targetType: "user",
    targetId: id,
    details: input,
  });

  return NextResponse.json({ ok: true });
}
