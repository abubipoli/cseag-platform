import { NextRequest, NextResponse } from "next/server";
import { getPublishedContentBySlug, getViewer } from "@/lib/content";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();

  const item = await getPublishedContentBySlug(slug, viewer);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ item, isMember: viewer.isMember });
}
