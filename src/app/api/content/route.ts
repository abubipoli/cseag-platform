// GET /api/content?type=news|event|resource — public, published-only listing
// (SRS 6.9). Member-only resources are included with a flag but the caller
// is expected to gate access; download links for gated items should not be
// rendered to non-members by the page itself.
import { NextRequest, NextResponse } from "next/server";
import { CONTENT_TYPES } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { listPublishedContent } from "@/lib/content";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const session = await getSession();
  const isMember = !!session && session.role !== "applicant";

  const validType = type && (CONTENT_TYPES as readonly string[]).includes(type) ? (type as (typeof CONTENT_TYPES)[number]) : undefined;
  const items = await listPublishedContent(validType, isMember);

  return NextResponse.json({ items });
}
