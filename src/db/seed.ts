// Creates the first super_admin account so someone can log in and start
// approving applications. Safe to re-run — it skips creation if the email
// already exists.
//
// Usage: SEED_ADMIN_EMAIL=you@cyberexpertgh.org SEED_ADMIN_PASSWORD=... npx tsx src/db/seed.ts

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { users, memberProfiles } from "./schema";
import { hashPassword } from "../lib/auth";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME || "CSEAG Administrator";

  if (!email || !password) {
    console.error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables before running this script."
    );
    process.exit(1);
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    console.log(`An account for ${email} already exists (role: ${existing.role}). Nothing to do.`);
    return;
  }

  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash: await hashPassword(password),
    role: "super_admin",
  });
  await db.insert(memberProfiles).values({
    id: randomUUID(),
    userId,
    fullName,
    phone: "+233000000000",
    membershipCategory: "full_professional",
  });

  console.log(`Created super_admin account for ${email}.`);
}

main().then(() => process.exit(0));
