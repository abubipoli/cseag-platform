// GET /api/admin/members — member management list (SRS 6.7): search, filter.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";

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

  return NextResponse.json({ members: shaped });
}
