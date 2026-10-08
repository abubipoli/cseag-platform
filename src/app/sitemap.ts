import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems } from "@/db/schema";
import { SITE_CONFIG } from "@/lib/constants";
import { listExperts } from "@/lib/experts";

const BASE_URL = `https://${SITE_CONFIG.domain}`;

// Static marketing pages. /apply and /donate are intentionally left off for
// now — they're client-rendered with no per-page metadata yet, a separate
// follow-up from this SEO pass.
const STATIC_PATHS = ["", "/about", "/what-we-do", "/experts", "/news", "/events", "/resources", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));

  // News and events each have their own /[slug] detail page; resources are
  // just downloadable attachments listed on /resources, with no detail page
  // of their own.
  const published = await db
    .select({ slug: contentItems.slug, type: contentItems.type, updatedAt: contentItems.updatedAt })
    .from(contentItems)
    .where(eq(contentItems.status, "published"));

  const contentEntries: MetadataRoute.Sitemap = published
    .filter((c) => c.type === "news" || c.type === "event")
    .map((c) => ({
      url: `${BASE_URL}/${c.type === "news" ? "news" : "events"}/${c.slug}`,
      lastModified: new Date(c.updatedAt),
    }));

  const experts = await listExperts();
  const expertEntries: MetadataRoute.Sitemap = experts.map((e) => ({
    url: `${BASE_URL}/experts/${e.id}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...contentEntries, ...expertEntries];
}
