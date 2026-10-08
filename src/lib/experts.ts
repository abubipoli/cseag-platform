// Shared Expert Directory queries (SRS Section 6.8), used by both the
// public pages (server components, for real SSR content search engines can
// index) and the /api/experts routes (used by the directory's client-side
// search/filter). Querying the database directly here — rather than each
// caller duplicating the same join — mirrors the same consolidation done in
// lib/content.ts.
import { cache } from "react";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { memberProfiles, users } from "@/db/schema";

export interface ExpertSummary {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  employer: string | null;
  currentRole: string | null;
  areasOfExpertise: string[];
}

export interface ExpertDetail extends ExpertSummary {
  certifications: string[];
  allowPublicContact: boolean;
}

const SELECT_FIELDS = {
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
} as const;

function shapeDetail(r: Record<string, unknown>): ExpertDetail {
  return {
    id: r.userId as string,
    name: r.fullName as string,
    photoUrl: r.photoIsPublic ? (r.photoUrl as string | null) : null,
    bio: r.bioIsPublic ? (r.bio as string | null) : null,
    yearsOfExperience: r.yearsOfExperienceIsPublic ? (r.yearsOfExperience as number | null) : null,
    employer: r.employerRoleIsPublic ? (r.employer as string | null) : null,
    currentRole: r.employerRoleIsPublic ? (r.currentRole as string | null) : null,
    areasOfExpertise: r.areasOfExpertiseIsPublic ? JSON.parse((r.areasOfExpertise as string) || "[]") : [],
    certifications: r.certificationsIsPublic ? JSON.parse((r.certifications as string) || "[]") : [],
    allowPublicContact: r.allowPublicContact as boolean,
  };
}

function normalizeId(id: string | null | undefined): string {
  return (id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function listExperts({ q, expertise }: { q?: string; expertise?: string } = {}): Promise<
  ExpertSummary[]
> {
  // membershipId is selected only so a search can match on it; it is never
  // copied into the returned objects (which are serialised into page HTML).
  const rows = await db
    .select({ ...SELECT_FIELDS, membershipId: memberProfiles.membershipId })
    .from(memberProfiles)
    .innerJoin(users, eq(users.id, memberProfiles.userId))
    .where(and(eq(users.isActive, true), ne(users.role, "applicant"), eq(memberProfiles.isListedInDirectory, true)));

  let entries = rows.map((r) => ({ expert: shapeDetail(r), idKey: normalizeId(r.membershipId) }));

  if (q) {
    const needle = q.trim().toLowerCase();
    if (needle) {
      // Member IDs match exactly (so typing "CSEAG-10002", "cseag10002" or
      // just "10002" finds that one member). Partial matching is for names
      // only — substring-matching IDs would be noisy and let people walk
      // through the ID range one prefix at a time.
      const idQuery = normalizeId(needle);
      entries = entries.filter(
        (e) => e.expert.name.toLowerCase().includes(needle) || (!!e.idKey && (e.idKey === idQuery || e.idKey === `cseag${idQuery}`))
      );
    }
  }
  if (expertise) {
    entries = entries.filter((e) => e.expert.areasOfExpertise.includes(expertise));
  }

  return entries.map((e) => e.expert);
}

// Wrapped in React's per-request cache so generateMetadata() and the page
// component both hitting this for the same id (a normal Next.js pattern)
// only issues one DB query, not two.
export const getExpertById = cache(async function getExpertById(id: string): Promise<ExpertDetail | null> {
  const rows = await db
    .select(SELECT_FIELDS)
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

  const r = rows[0];
  return r ? shapeDetail(r) : null;
});
