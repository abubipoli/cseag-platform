import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPublishedContentBySlug } from "@/lib/content";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const isMember = !!session && session.role !== "applicant";

  const item = await getPublishedContentBySlug(slug, isMember);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ item, isMember });
}
