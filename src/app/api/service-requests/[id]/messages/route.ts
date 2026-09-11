// GET/POST /api/service-requests/:id/messages — the monitored chat thread
// between the assigned expert and the requester.
//
// Three ways to be authorized on a ticket, since the requester never has an
// account:
//   1. The logged-in session is the assigned expert (assignedExpertUserId).
//   2. The logged-in session is a reviewer/admin — read/post for oversight.
//   3. No session, but the request carries ?token= matching the ticket's
//      accessToken — this is the requester, identified only by the secret
//      link emailed to them.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { serviceRequests, serviceRequestMessages, memberProfiles, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { serviceRequestMessageSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";

type Viewer =
  | { role: "expert"; userId: string; name: string }
  | { role: "admin"; userId: string; name: string }
  | { role: "requester"; name: string };

async function resolveViewer(
  ticket: typeof serviceRequests.$inferSelect,
  token: string | null
): Promise<Viewer | null> {
  const session = await getSession();
  if (session) {
    if (await hasPermission(session, "serviceRequests")) {
      const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, session.userId) });
      return { role: "admin", userId: session.userId, name: profile?.fullName || "CSEAG Team" };
    }
    if (ticket.assignedExpertUserId === session.userId) {
      const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, session.userId) });
      return { role: "expert", userId: session.userId, name: profile?.fullName || "Expert" };
    }
  }
  if (token && ticket.accessToken && token === ticket.accessToken) {
    return { role: "requester", name: ticket.requesterName };
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token");

  const ticket = await db.query.serviceRequests.findFirst({ where: eq(serviceRequests.id, id) });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const viewer = await resolveViewer(ticket, token);
  if (!viewer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await db.query.serviceRequestMessages.findMany({
    where: eq(serviceRequestMessages.serviceRequestId, id),
    orderBy: asc(serviceRequestMessages.createdAt),
  });

  const assignedExpert = ticket.assignedExpertUserId
    ? await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, ticket.assignedExpertUserId) })
    : null;

  return NextResponse.json({
    viewerRole: viewer.role,
    ticket: {
      id: ticket.id,
      status: ticket.status,
      message: ticket.message,
      requesterName: ticket.requesterName,
      expertName: assignedExpert?.fullName || null,
      assigned: !!ticket.assignedExpertUserId,
    },
    messages,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token");

  const ticket = await db.query.serviceRequests.findFirst({ where: eq(serviceRequests.id, id) });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const viewer = await resolveViewer(ticket, token);
  if (!viewer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!ticket.assignedExpertUserId) {
    return NextResponse.json({ error: "This ticket hasn't been assigned to an expert yet." }, { status: 422 });
  }

  const body = await req.json().catch(() => null);
  const parsed = serviceRequestMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const messageId = randomUUID();
  await db.insert(serviceRequestMessages).values({
    id: messageId,
    serviceRequestId: id,
    senderRole: viewer.role,
    senderName: viewer.name,
    message: parsed.data.message,
  });

  const nowIso = new Date().toISOString();
  const statusUpdate: Record<string, unknown> = { updatedAt: nowIso };
  if (viewer.role !== "admin" && ticket.status !== "resolved" && ticket.status !== "declined") {
    statusUpdate.status = "in_progress";
  }
  await db.update(serviceRequests).set(statusUpdate).where(eq(serviceRequests.id, id));

  // Notify whichever side didn't send this message. Admin messages notify
  // both, since either side might not be watching the thread live.
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const chatUrlForRequester = `${origin}/requests/${id}?token=${ticket.accessToken}`;
  const dashboardUrlForExpert = `${origin}/dashboard?tab=requests`;

  const notifyExpert = async () => {
    const expertUser = await db.query.users.findFirst({ where: eq(users.id, ticket.assignedExpertUserId!) });
    const expertProfile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, ticket.assignedExpertUserId!) });
    if (!expertUser || !expertProfile) return;
    const isPlaceholderEmail = expertUser.email.endsWith("@migrated.cyberexpertgh.org");
    if (isPlaceholderEmail) return;
    await notify({
      userId: expertUser.id,
      templateKey: "service_request_new_message",
      email: expertUser.email,
      data: { name: expertProfile.fullName, fromName: viewer.name, message: parsed.data.message, chatUrl: dashboardUrlForExpert },
    });
  };

  const notifyRequester = async () => {
    await notify({
      templateKey: "service_request_new_message",
      email: ticket.requesterEmail,
      data: { name: ticket.requesterName, fromName: viewer.name, message: parsed.data.message, chatUrl: chatUrlForRequester },
    });
  };

  if (viewer.role === "expert") {
    await notifyRequester();
  } else if (viewer.role === "requester") {
    await notifyExpert();
  } else {
    await Promise.all([notifyExpert(), notifyRequester()]);
  }

  return NextResponse.json({ ok: true, id: messageId });
}
