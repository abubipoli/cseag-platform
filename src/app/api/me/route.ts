// GET  /api/me  — the logged-in user's own account + profile + application.
// PATCH /api/me — update own profile fields and public-visibility choices
//                 (SRS Section 6.5 / 6.6). Sensitive fields (DOB, national ID,
//                 physical address) are never accepted here — see
//                 profileUpdateSchema, which simply has no field for them.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memberProfiles, applications } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, session.userId) });
  const application = await db.query.applications.findFirst({ where: eq(applications.userId, session.userId) });

  return NextResponse.json({ session, profile, application });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of [
    "title",
    "fullName",
    "phone",
    "ageGroup",
    "region",
    "employer",
    "currentRole",
    "yearsOfExperience",
    "highestCertificate",
    "bio",
    "photoUrl",
    "bioIsPublic",
    "yearsOfExperienceIsPublic",
    "areasOfExpertiseIsPublic",
    "employerRoleIsPublic",
    "certificationsIsPublic",
    "photoIsPublic",
    "allowPublicContact",
  ] as const) {
    if (input[key] !== undefined) update[key] = input[key];
  }
  if (input.areasOfExpertise) update.areasOfExpertise = JSON.stringify(input.areasOfExpertise);
  if (input.certifications) update.certifications = JSON.stringify(input.certifications);

  // Only an approved member (not a tier-1 applicant) becomes eligible for
  // the public directory, and only once they've saved visibility choices at
  // least once (Section 6.4 / 6.6).
  if (session.role !== "applicant") {
    update.isListedInDirectory = true;
  }

  await db.update(memberProfiles).set(update).where(eq(memberProfiles.userId, session.userId));
  await recordAudit({
    actorUserId: session.userId,
    action: "profile.updated",
    targetType: "member_profile",
    targetId: session.userId,
  });

  return NextResponse.json({ ok: true });
}
