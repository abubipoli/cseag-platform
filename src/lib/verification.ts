// Membership verification: each member gets a random, unguessable code that
// goes into their QR (/verify/<code>). Scanning it opens a public page that
// checks the live membership record.
import { randomBytes } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { memberProfiles, users } from "@/db/schema";
import { SITE_CONFIG } from "@/lib/constants";

const newToken = () => randomBytes(18).toString("base64url");

export const verifyUrl = (token: string) => `https://${SITE_CONFIG.domain}/verify/${token}`;

// Atomic: if two requests race, coalesce keeps whichever token landed first,
// so a member never ends up with two different codes.
export async function getOrCreateVerificationToken(userId: string): Promise<string | null> {
  const [row] = await db
    .update(memberProfiles)
    .set({ verificationToken: sql`coalesce(${memberProfiles.verificationToken}, ${newToken()})` })
    .where(eq(memberProfiles.userId, userId))
    .returning({ token: memberProfiles.verificationToken });
  return row?.token ?? null;
}

// Replaces the code, so every previously issued QR for this member stops working.
export async function rotateVerificationToken(userId: string): Promise<string | null> {
  const [row] = await db
    .update(memberProfiles)
    .set({ verificationToken: newToken() })
    .where(eq(memberProfiles.userId, userId))
    .returning({ token: memberProfiles.verificationToken });
  return row?.token ?? null;
}

export async function findMemberByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return null;
  const rows = await db
    .select({
      fullName: memberProfiles.fullName,
      title: memberProfiles.title,
      membershipId: memberProfiles.membershipId,
      category: memberProfiles.membershipCategory,
      photoUrl: memberProfiles.photoUrl,
      photoIsPublic: memberProfiles.photoIsPublic,
      isActive: users.isActive,
    })
    .from(memberProfiles)
    .innerJoin(users, eq(users.id, memberProfiles.userId))
    .where(and(eq(memberProfiles.verificationToken, token), ne(users.role, "applicant")))
    .limit(1);
  return rows[0] ?? null;
}
