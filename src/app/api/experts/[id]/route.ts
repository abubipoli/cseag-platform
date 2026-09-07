import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { memberProfiles, users } from "@/db/schema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const row = await db
    .select({
      userId: users.id,
      fullName: memberProfiles.fullName,
      photoUrl: memberProfiles.photoUrl,
      bio: memberProfiles.bio,
      yearsOfExperience: memberProfiles.yearsOfExperience,
      employer: memberProfiles.employer,
      currentRole: memberProfiles.currentRole,
      areasOfExpertise: memberProfiles.areasOfExpertise,
      certifications: memberProfiles.certifications,
      bioIsPublic: memberProfiles.bioIsPublic,
      yearsOfExperienceIsPublic: memberProfiles.yearsOfExperienceIsPublic,
      areasOfExpertiseIsPublic: memberProfiles.areasOfExpertiseIsPublic,
      employerRoleIsPublic: memberProfiles.employerRoleIsPublic,
      certificationsIsPublic: memberProfiles.certificationsIsPublic,
      photoIsPublic: memberProfiles.photoIsPublic,
      allowPublicContact: memberProfiles.allowPublicContact,
    })
    .from(memberProfiles)
    .innerJoin(users, eq(users.id, memberProfiles.userId))
    .where(
      and(
        eq(users.id, id),
        eq(users.isActive, true),
        ne(users.role, "applicant"),
        eq(memberProfiles.isListedInDirectory, true)
      )
    )
    .limit(1);

  const r = row[0];
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    expert: {
      id: r.userId,
      name: r.fullName,
      photoUrl: r.photoIsPublic ? r.photoUrl : null,
      bio: r.bioIsPublic ? r.bio : null,
      yearsOfExperience: r.yearsOfExperienceIsPublic ? r.yearsOfExperience : null,
      employer: r.employerRoleIsPublic ? r.employer : null,
      currentRole: r.employerRoleIsPublic ? r.currentRole : null,
      areasOfExpertise: r.areasOfExpertiseIsPublic ? JSON.parse(r.areasOfExpertise || "[]") : [],
      certifications: r.certificationsIsPublic ? JSON.parse(r.certifications || "[]") : [],
      allowPublicContact: r.allowPublicContact,
    },
  });
}
