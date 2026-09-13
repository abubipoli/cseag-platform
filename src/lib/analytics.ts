// Site-visit tracking (see db/schema.ts's siteVisits comment for the full
// picture). Two deliberate performance choices here:
//
// 1. Country lookup happens AFTER the visit row is inserted and is never
//    awaited by the caller — a slow/rate-limited geo API must never add
//    latency to a real visitor's page load.
// 2. IP -> country results are cached in memory for the life of the
//    process, since this app runs as a single long-lived Node process
//    (not serverless), and repeat visits from the same IP are common.
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { siteVisits } from "@/db/schema";
import { eq } from "drizzle-orm";

const countryCache = new Map<string, { country: string | null; city: string | null }>();

// Private/local addresses never resolve to a real location — skip the API
// call entirely for these (common in local dev, and behind some proxies).
function isPrivateIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

async function resolveGeo(ip: string): Promise<{ country: string | null; city: string | null }> {
  if (countryCache.has(ip)) return countryCache.get(ip)!;
  if (isPrivateIp(ip)) {
    const result = { country: null, city: null };
    countryCache.set(ip, result);
    return result;
  }

  let result = { country: null as string | null, city: null as string | null };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (data?.status === "success") {
      result = { country: data.country || null, city: data.city || null };
    }
  } catch {
    // Best-effort only — leave both fields null on any failure/timeout.
  }
  countryCache.set(ip, result);
  return result;
}

export function recordVisit(opts: { path: string; ip: string | null; userAgent: string | null; referrer: string | null; userId?: string }): void {
  const id = randomUUID();
  const ip = opts.ip;

  // Fire-and-forget: the caller (middleware) must not wait on this.
  void (async () => {
    try {
      await db.insert(siteVisits).values({
        id,
        path: opts.path,
        userId: opts.userId,
        ip,
        referrer: opts.referrer,
        userAgent: opts.userAgent,
      });

      if (ip) {
        const geo = await resolveGeo(ip);
        if (geo.country) {
          await db.update(siteVisits).set({ country: geo.country, city: geo.city }).where(eq(siteVisits.id, id));
        }
      }
    } catch {
      // Analytics must never break the site — swallow any failure here.
    }
  })();
}
