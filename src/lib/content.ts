// Shared content-item queries (SRS 6.9), used directly by both the public
// pages (server components) and the /api/content routes.
//
// Page components used to fetch their own /api/content route over HTTP
// (via getBaseUrl()) during server rendering — a self-referential request
// that works fine on Vercel but fails on some shared hosts (a "hairpin
// NAT"-style loopback issue: the server can't reliably reach its own public
// hostname). Querying the database directly here removes that whole class
// of failure and is simply more efficient regardless of host.

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems, memberProfiles, CONTENT_TYPES, type MembershipCategory } from "@/db/schema";
import { getSession } from "@/lib/auth";

type ContentType = (typeof CONTENT_TYPES)[number];

// Who's looking: a non-member (anonymous visitor or applicant) sees only
// public content; a member sees public content plus whatever news targets
// their own category (or "any member").
export interface Viewer {
  isMember: boolean;
  category: MembershipCategory | null;
}

export async function getViewer(): Promise<Viewer> {
  const session = await getSession();
  if (!session || session.role === "applicant") return { isMember: false, category: null };
  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, session.userId) });
  return { isMember: true, category: profile?.membershipCategory ?? null };
}

// Full-item audience gate — currently only enforced for type = "news".
// Resource/event/page items keep isMemberOnly's original, narrower meaning
// (see withFileUrlGate below): visible to everyone, just with the file
// download hidden from non-members.
export function isNewsVisibleToViewer<
  T extends { type: string; isMemberOnly: boolean; audienceCategory: MembershipCategory | null },
>(item: T, viewer: Viewer): boolean {
  if (item.type !== "news" || !item.isMemberOnly) return true;
  if (!viewer.isMember) return false;
  if (!item.audienceCategory) return true;
  return item.audienceCategory === viewer.category;
}

function withFileUrlGate<T extends { isMemberOnly: boolean; fileUrl: string | null }>(item: T, isMember: boolean): T {
  return { ...item, fileUrl: item.isMemberOnly && !isMember ? null : item.fileUrl };
}

export async function listPublishedContent(type: ContentType | undefined, viewer: Viewer) {
  const conditions = [eq(contentItems.status, "published")];
  if (type) conditions.push(eq(contentItems.type, type));

  const rows = await db
    .select()
    .from(contentItems)
    .where(and(...conditions))
    .orderBy(desc(contentItems.publishedAt), desc(contentItems.createdAt));

  return rows.filter((r) => isNewsVisibleToViewer(r, viewer)).map((r) => withFileUrlGate(r, viewer.isMember));
}

export async function getPublishedContentBySlug(slug: string, viewer: Viewer) {
  const item = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.slug, slug), eq(contentItems.status, "published")),
  });
  if (!item || !isNewsVisibleToViewer(item, viewer)) return null;
  return withFileUrlGate(item, viewer.isMember);
}
