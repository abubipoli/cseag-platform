// GET  /api/admin/members — member management list (SRS 6.7): search, filter.
// POST /api/admin/members — create a new user account directly (staff who
// aren't going through the public membership application, or promoting
// someone straight to reviewer/admin).
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles } from "@/db/schema";
import { getSession, roleAtLeast, generateTemporaryPassword, hashPassword } from "@/lib/auth";
import { adminCreateUserSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { ROLE_LABELS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const role = searchParams.get("role");
  const status = searchParams.get("status"); // active | inactive
  const category = searchParams.get("category");
  const region = searchParams.get("region");

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      fullName: memberProfiles.fullName,
      phone: memberProfiles.phone,
      photoUrl: memberProfiles.photoUrl,
      membershipCategory: memberProfiles.membershipCategory,
      region: memberProfiles.region,
    })
    .from(users)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id));

  let shaped = rows;
  if (q) {
    shaped = shaped.filter(
      (r) => r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.phone || "").includes(q)
    );
  }
  if (role) shaped = shaped.filter((r) => r.role === role);
  if (status === "active") shaped = shaped.filter((r) => r.isActive);
  if (status === "inactive") shaped = shaped.filter((r) => !r.isActive);
  if (category) shaped = shaped.filter((r) => r.membershipCategory === category);
  if (region) shaped = shaped.filter((r) => r.region === region);

  return NextResponse.json({ members: shaped });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminCreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  if ((input.role === "admin" || input.role === "super_admin") && !roleAtLeast(session.role, "super_admin")) {
    return NextResponse.json({ error: "Only a super admin can grant administrator access." }, { status: 403 });
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) {
    return NextResponse.json({ error: { formErrors: ["An account with this email already exists."] } }, { status: 409 });
  }

  const userId = randomUUID();
  const tempPassword = generateTemporaryPassword();
  await db.insert(users).values({
    id: userId,
    email: input.email,
    passwordHash: await hashPassword(tempPassword),
    role: input.role,
  });
  await db.insert(memberProfiles).values({
    id: randomUUID(),
    userId,
    fullName: input.fullName,
    phone: input.phone,
    membershipCategory: input.membershipCategory,
    areasOfExpertise: "[]",
    certifications: "[]",
  });

  await notify({
    userId,
    templateKey: "account_created_by_admin",
    email: input.email,
    phone: input.phone,
    data: { name: input.fullName, email: input.email, role: ROLE_LABELS[input.role] || input.role, tempPassword },
  });

  await recordAudit({
    actorUserId: session.userId,
    action: "user.created",
    targetType: "user",
    targetId: userId,
    details: { role: input.role, email: input.email },
  });

  return NextResponse.json({ ok: true, id: userId }, { status: 201 });
}
