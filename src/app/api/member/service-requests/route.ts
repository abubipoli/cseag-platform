// GET /api/member/service-requests — tickets assigned to the logged-in
// member, shown in their dashboard's "My Requests" tab.
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { serviceRequests } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const rows = await db.query.serviceRequests.findMany({
    where: eq(serviceRequests.assignedExpertUserId, session.userId),
    orderBy: desc(serviceRequests.updatedAt),
  });

  return NextResponse.json({ requests: rows });
}
