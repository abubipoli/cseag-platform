// One-off: promotes the migrated "Abubakar Issaka" expert record to a real
// super_admin login with his actual email, rather than creating a separate
// duplicate account. Safe to adapt for future admin promotions.
//
// Usage: SUPER_ADMIN_EMAIL=you@example.com npx tsx src/db/create-super-admin.ts

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { users, memberProfiles } from "./schema";
import { hashPassword } from "../lib/auth";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  if (!email) {
    console.error("Set SUPER_ADMIN_EMAIL before running this script.");
    process.exit(1);
  }

  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.fullName, "Abubakar Issaka") });
  if (!profile) {
    console.error('No member profile found for "Abubakar Issaka".');
    process.exit(1);
  }

  const password = randomBytes(9).toString("base64url");
  await db
    .update(users)
    .set({ email, role: "super_admin", passwordHash: await hashPassword(password), isActive: true })
    .where(eq(users.id, profile.userId));

  console.log("Super admin credential created:");
  console.log("  Email:   ", email);
  console.log("  Password:", password);
}

main().then(() => process.exit(0));
