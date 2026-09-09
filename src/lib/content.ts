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
import { contentItems, CONTENT_TYPES } from "@/db/schema";

type ContentType = (typeof CONTENT_TYPES)[number];

function withFileUrlGate<T extends { isMemberOnly: boolean; fileUrl: string | null }>(item: T, isMember: boolean): T {
  return { ...item, fileUrl: item.isMemberOnly && !isMember ? null : item.fileUrl };
}

export async function listPublishedContent(type: ContentType | undefined, isMember: boolean) {
  const conditions = [eq(contentItems.status, "published")];
  if (type) conditions.push(eq(contentItems.type, type));

  const rows = await db
    .select()
    .from(contentItems)
    .where(and(...conditions))
    .orderBy(desc(contentItems.publishedAt), desc(contentItems.createdAt));

  return rows.map((r) => withFileUrlGate(r, isMember));
}

export async function getPublishedContentBySlug(slug: string, isMember: boolean) {
  const item = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.slug, slug), eq(contentItems.status, "published")),
  });
  if (!item) return null;
  return withFileUrlGate(item, isMember);
}
