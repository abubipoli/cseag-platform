// Membership ID assignment — a permanent, human-readable member number
// (e.g. "CSEAG-00001"), shown to the member and to admins. Assigned once,
// at the moment an application is approved, and never reused.
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { memberProfiles } from "@/db/schema";

const PREFIX = "CSEAG-";
const PAD_LENGTH = 5;

// Reads the current highest-numbered ID and returns the next one. A plain
// MAX+1 query rather than a DB sequence — approvals are a rare, one-at-a-time
// admin action, not a high-concurrency path, so the tiny race window this
// leaves is an acceptable tradeoff for not needing a dedicated sequence.
async function nextMembershipId(): Promise<string> {
  const rows = await db
    .select({ maxNum: sql<number>`coalesce(max(cast(substring(${memberProfiles.membershipId} from ${PREFIX.length + 1}) as integer)), 0)` })
    .from(memberProfiles)
    .where(sql`${memberProfiles.membershipId} is not null`);

  const next = (rows[0]?.maxNum ?? 0) + 1;
  return `${PREFIX}${String(next).padStart(PAD_LENGTH, "0")}`;
}

// Assigns a membership ID to this user if they don't already have one.
// Safe to call every time an application is approved — a no-op for anyone
// who already has an ID (e.g. re-approved after being previously a member).
export async function assignMembershipId(userId: string): Promise<void> {
  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, userId) });
  if (!profile || profile.membershipId) return;

  const id = await nextMembershipId();
  await db.update(memberProfiles).set({ membershipId: id }).where(eq(memberProfiles.userId, userId));
}
