// GET /api/experts?q=&expertise=
// Public expert directory (SRS Section 6.8). Powers the directory's
// client-side search/filter; the initial page load itself is now rendered
// server-side (see (site)/experts/page.tsx) so search engines see real
// content without needing this endpoint.
import { NextRequest, NextResponse } from "next/server";
import { listExperts } from "@/lib/experts";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || undefined;
  const expertise = searchParams.get("expertise")?.trim() || undefined;

  const experts = await listExperts({ q, expertise });
  return NextResponse.json({ experts });
}
