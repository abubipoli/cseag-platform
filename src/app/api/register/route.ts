// POST /api/register
// Public membership application endpoint (SRS Section 6.2 / 6.3 / 6.4).
//
// On success this:
//   1. Creates a "applicant" tier-1 account (limited access — Section 6.4).
//   2. Creates the member profile record with all visibility flags off.
//   3. Creates the application record for the review queue.
//   4. Sends an email + SMS acknowledgment immediately.
//   5. Logs the applicant straight in (their own limited-access session).

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, memberProfiles, applications } from "@/db/schema";
import { registrationSchema } from "@/lib/validation";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) {
    return NextResponse.json(
      { error: { formErrors: ["An account with this email already exists. Try logging in instead."] } },
      { status: 409 }
    );
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(input.password);

  await db.insert(users).values({
    id: userId,
    email: input.email,
    passwordHash,
    role: "applicant",
  });

  await db.insert(memberProfiles).values({
    id: randomUUID(),
    userId,
    fullName: input.fullName,
    phone: input.phone,
    region: input.region,
    employer: input.employer,
    currentRole: input.currentRole,
    yearsOfExperience: input.yearsOfExperience,
    areasOfExpertise: JSON.stringify(input.areasOfExpertise),
    certifications: JSON.stringify(input.certifications || []),
    bio: input.bio,
    membershipCategory: input.membershipCategory,
  });

  await db.insert(applications).values({
    id: randomUUID(),
    userId,
    statementOfInterest: input.statementOfInterest,
    codeOfConductAccepted: input.codeOfConductAccepted,
    privacyConsentAccepted: input.privacyConsentAccepted,
    status: "pending",
  });

  await recordAudit({ actorUserId: userId, action: "application.submitted", targetType: "user", targetId: userId });

  // Acceptance criterion (SRS Section 11, #1): acknowledgment within minutes.
  await notify({
    userId,
    templateKey: "application_received",
    email: input.email,
    phone: input.phone,
    data: { name: input.fullName },
  });

  await setSessionCookie({ userId, role: "applicant", email: input.email });

  return NextResponse.json({ ok: true }, { status: 201 });
}
