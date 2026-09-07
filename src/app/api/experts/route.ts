// GET /api/experts?q=&expertise=
// Public expert directory (SRS Section 6.8). Only returns members who are
// (a) active, (b) role >= member, and (c) have opted into the directory —
// and, for each one, ONLY the fields they've marked public (Section 6.6).
// This is the enforcement point for "members declare what goes public."

import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { memberProfiles, users } from "@/db/schema";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const expertise = searchParams.get("expertise")?.trim();

  const rows = await db
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
      and(eq(users.isActive, true), ne(users.role, "applicant"), eq(memberProfiles.isListedInDirectory, true))
    );

  let shaped = rows.map((r) => ({
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
  }));

  if (q) {
    shaped = shaped.filter((e) => e.name.toLowerCase().includes(q));
  }
  if (expertise) {
    shaped = shaped.filter((e) => e.areasOfExpertise.includes(expertise));
  }

  return NextResponse.json({ experts: shaped });
}
