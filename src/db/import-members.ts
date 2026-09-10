// One-off import of the pre-existing CSEAG member roster (from the
// association's own membership spreadsheet, collected before this platform
// existed) into the live database.
//
// Two kinds of rows, read from a JSON plan produced out-of-band from the
// source spreadsheet:
//   - "updates": people who already have a placeholder account here from
//     src/db/seed-experts.ts (an @migrated.cyberexpertgh.org email, because
//     their real contact details weren't public at the time) — matched by
//     name. These get their real email + phone filled in, plus a few fields
//     seed-experts.ts never set (title/region/age group/highest
//     certificate). Fields seed-experts.ts already curated (bio, areas of
//     expertise, employer/role, photo, membership category) are left alone.
//   - "creates": everyone else — a brand-new user + member_profiles row.
//
// Every created/updated account is a "member" (already an accepted member
// of record, not going through the applicant workflow) but starts with a
// random password and no notification is sent — nobody is emailed or texted
// by this script. Directory listing defaults to off either way, since that
// is always the member's own opt-in choice (see /api/me).
//
// Safe to re-run: an update is skipped if the placeholder account is gone,
// and a create is skipped if that email already has an account.
//
// Usage: npx tsx --env-file=.env.local src/db/import-members.ts path/to/import-plan.json

import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { users, memberProfiles } from "./schema";
import { hashPassword } from "../lib/auth";

interface PlanRecord {
  email: string;
  fullName: string;
  phone: string;
  title: string | null;
  region: string | null;
  ageGroup: string | null;
  highestCertificate: string | null;
  certifications: string[];
  employer: string | null;
  currentRole: string | null;
  yearsOfExperience: number | null;
  migratedEmail?: string;
}

interface Plan {
  updates: PlanRecord[];
  creates: PlanRecord[];
}

async function main() {
  const planPath = process.argv[2];
  if (!planPath) {
    console.error("Usage: npx tsx --env-file=.env.local src/db/import-members.ts <plan.json>");
    process.exit(1);
  }
  const plan: Plan = JSON.parse(readFileSync(planPath, "utf8"));

  let updated = 0;
  let updateSkipped = 0;
  let created = 0;
  let createSkipped = 0;

  for (const rec of plan.updates) {
    const placeholder = await db.query.users.findFirst({ where: eq(users.email, rec.migratedEmail!) });
    if (!placeholder) {
      console.log(`SKIP update (placeholder not found): ${rec.fullName} <${rec.migratedEmail}>`);
      updateSkipped++;
      continue;
    }
    const emailTaken = await db.query.users.findFirst({ where: eq(users.email, rec.email) });
    if (emailTaken && emailTaken.id !== placeholder.id) {
      console.log(`SKIP update (real email already used by another account): ${rec.fullName} <${rec.email}>`);
      updateSkipped++;
      continue;
    }

    await db.update(users).set({ email: rec.email, updatedAt: new Date().toISOString() }).where(eq(users.id, placeholder.id));

    const existingProfile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, placeholder.id) });
    const fill: Record<string, unknown> = { phone: rec.phone, updatedAt: new Date().toISOString() };
    if (rec.title) fill.title = rec.title;
    if (rec.region) fill.region = rec.region;
    if (rec.ageGroup) fill.ageGroup = rec.ageGroup;
    if (rec.highestCertificate && !existingProfile?.highestCertificate) fill.highestCertificate = rec.highestCertificate;
    if (rec.employer && !existingProfile?.employer) fill.employer = rec.employer;
    if (rec.currentRole && !existingProfile?.currentRole) fill.currentRole = rec.currentRole;
    if (rec.yearsOfExperience != null && existingProfile?.yearsOfExperience == null) fill.yearsOfExperience = rec.yearsOfExperience;
    if (rec.certifications.length > 0 && (!existingProfile?.certifications || existingProfile.certifications === "[]")) {
      fill.certifications = JSON.stringify(rec.certifications);
    }
    await db.update(memberProfiles).set(fill).where(eq(memberProfiles.userId, placeholder.id));

    console.log(`UPDATED: ${rec.fullName} — ${rec.migratedEmail} -> ${rec.email}`);
    updated++;
  }

  for (const rec of plan.creates) {
    const existing = await db.query.users.findFirst({ where: eq(users.email, rec.email) });
    if (existing) {
      console.log(`SKIP create (email already has an account): ${rec.fullName} <${rec.email}>`);
      createSkipped++;
      continue;
    }

    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      email: rec.email,
      passwordHash: await hashPassword(randomBytes(24).toString("hex")),
      role: "member",
      isActive: true,
    });
    await db.insert(memberProfiles).values({
      id: randomUUID(),
      userId,
      fullName: rec.fullName,
      phone: rec.phone,
      title: rec.title ?? undefined,
      region: rec.region ?? undefined,
      ageGroup: rec.ageGroup ?? undefined,
      highestCertificate: rec.highestCertificate ?? undefined,
      certifications: JSON.stringify(rec.certifications),
      areasOfExpertise: "[]",
      employer: rec.employer ?? undefined,
      currentRole: rec.currentRole ?? undefined,
      yearsOfExperience: rec.yearsOfExperience ?? undefined,
      membershipCategory: "full_professional",
      // Directory listing and every public-visibility flag stay at their
      // schema default (false) — imported members appear nowhere publicly
      // until they sign in and opt in themselves.
    });

    console.log(`CREATED: ${rec.fullName} <${rec.email}>`);
    created++;
  }

  console.log(
    `\nDone. Updated ${updated} existing placeholder account(s) (${updateSkipped} skipped), created ${created} new member account(s) (${createSkipped} skipped, already existed).`
  );
  console.log("No email or SMS was sent to anyone by this script.");
}

main().then(() => process.exit(0));
