// Membership ID assignment — a permanent, human-readable member number
// (e.g. "CSEAG-00001"), shown to the member and to admins. Assigned once,
// at the moment an application is approved, and never reused.
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { memberProfiles } from "@/db/schema";

const PREFIX = "CSEAG-";
const PAD_LENGTH = 5;
// Numbers start at 10001 rather than 1, so every member number reads as a
// full 5-digit ID from day one instead of looking like a placeholder
// ("CSEAG-00001"). Once real IDs pass 10000 this floor is irrelevant —
// MAX+1 naturally takes over — so it's safe to leave here permanently.
const STARTING_NUMBER = 10000;

// Reads the current highest-numbered ID and returns the next one. A plain
// MAX+1 query rather than a DB sequence — approvals are a rare, one-at-a-time
// admin action, not a high-concurrency path, so the tiny race window this
// leaves is an acceptable tradeoff for not needing a dedicated sequence.
async function nextMembershipId(): Promise<string> {
  const rows = await db
    .select({
      maxNum: sql<number>`greatest(coalesce(max(cast(substring(${memberProfiles.membershipId} from ${PREFIX.length + 1}) as integer)), 0), ${STARTING_NUMBER})`,
    })
    .from(memberProfiles)
    .where(sql`${memberProfiles.membershipId} is not null`);

  const next = (rows[0]?.maxNum ?? STARTING_NUMBER) + 1;
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
