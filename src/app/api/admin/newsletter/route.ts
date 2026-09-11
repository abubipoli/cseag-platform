// GET /api/admin/newsletter — every public "Stay Updated" signup, newest
// first. These are just email addresses with no account attached (see
// db/schema.ts's newsletterSubscribers table) — separate from member/admin
// users entirely.
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "newsletter"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscribers = await db.query.newsletterSubscribers.findMany({
    orderBy: desc(newsletterSubscribers.subscribedAt),
  });

  return NextResponse.json({ subscribers });
}
