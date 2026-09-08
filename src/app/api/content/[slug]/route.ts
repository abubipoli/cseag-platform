import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { contentItems } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const isMember = !!session && session.role !== "applicant";

  const item = await db.query.contentItems.findFirst({
    where: and(eq(contentItems.slug, slug), eq(contentItems.status, "published")),
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    item: { ...item, fileUrl: item.isMemberOnly && !isMember ? null : item.fileUrl },
    isMember,
  });
}
