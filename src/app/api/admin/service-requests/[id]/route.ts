// PATCH /api/admin/service-requests/:id — update ticket status/notes, and
// assign or reassign the ticket to an expert. Assigning always notifies the
// expert (email + SMS) and emails the requester their chat link, since the
// requester never has an account.
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { serviceRequests, memberProfiles, users } from "@/db/schema";
import { getSession, roleAtLeast } from "@/lib/auth";
import { serviceRequestUpdateSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = serviceRequestUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  const ticket = await db.query.serviceRequests.findFirst({ where: eq(serviceRequests.id, id) });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.status) updates.status = input.status;
  if (input.adminNotes !== undefined) updates.adminNotes = input.adminNotes;

  if (input.assignExpertUserId) {
    const expertUser = await db.query.users.findFirst({ where: eq(users.id, input.assignExpertUserId) });
    const expertProfile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, input.assignExpertUserId) });
    if (!expertUser || !expertProfile) {
      return NextResponse.json({ error: "Expert record not found" }, { status: 404 });
    }
    const usablePhone = expertProfile.phone && expertProfile.phone !== "+233000000000" ? expertProfile.phone : undefined;
    const isPlaceholderEmail = expertUser.email.endsWith("@migrated.cyberexpertgh.org");
    if (isPlaceholderEmail && !usablePhone) {
      return NextResponse.json(
        { error: "This expert has no real email or phone on file yet — add one from Members before assigning them." },
        { status: 422 }
      );
    }

    const accessToken = ticket.accessToken || randomBytes(24).toString("base64url");
    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const dashboardUrl = `${origin}/dashboard?tab=requests`;
    const chatUrl = `${origin}/requests/${id}?token=${accessToken}`;

    await notify({
      userId: expertUser.id,
      templateKey: "service_request_assigned_expert",
      email: isPlaceholderEmail ? undefined : expertUser.email,
      phone: usablePhone,
      replyTo: ticket.requesterEmail,
      data: {
        name: expertProfile.fullName,
        fromName: ticket.requesterName,
        fromEmail: ticket.requesterEmail,
        fromPhone: ticket.requesterPhone || "",
        message: ticket.message,
        dashboardUrl,
      },
    });

    await notify({
      templateKey: "service_request_chat_link_requester",
      email: ticket.requesterEmail,
      phone: ticket.requesterPhone || undefined,
      data: { name: ticket.requesterName, expertName: expertProfile.fullName, chatUrl },
    });

    updates.assignedExpertUserId = input.assignExpertUserId;
    updates.assignedAt = new Date().toISOString();
    updates.accessToken = accessToken;
    updates.expertNotifiedAt = new Date().toISOString();
    if (!input.status) updates.status = "contacted";
  }

  updates.handledBy = session.userId;
  await db.update(serviceRequests).set(updates).where(eq(serviceRequests.id, id));

  await recordAudit({
    actorUserId: session.userId,
    action: input.assignExpertUserId ? "service_request.assigned" : "service_request.updated",
    targetType: "service_request",
    targetId: id,
    details: input,
  });

  return NextResponse.json({ ok: true });
}
