// GET  /api/admin/members/:id/qr — the member's verification link and QR image
//                                  (created on first use).
// POST /api/admin/members/:id/qr — issue a new code, invalidating old QRs.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db/client";
import { memberProfiles, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { getOrCreateVerificationToken, rotateVerificationToken, verifyUrl } from "@/lib/verification";

async function payload(userId: string, token: string) {
  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, userId) });
  const url = verifyUrl(token);
  const qrDataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, width: 640 });
  return { verifyUrl: url, qrDataUrl, membershipId: profile?.membershipId ?? null };
}

async function isMember(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return !!user && user.role !== "applicant";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "membersView"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!(await isMember(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = await getOrCreateVerificationToken(id);
  if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await payload(id, token));
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "membersManage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!(await isMember(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = await rotateVerificationToken(id);
  if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await recordAudit({ actorUserId: session.userId, action: "member.qr_regenerated", targetType: "user", targetId: id });
  return NextResponse.json(await payload(id, token));
}
