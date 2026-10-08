import { NextRequest, NextResponse } from "next/server";
import { getExpertById } from "@/lib/experts";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await getExpertById(id);
  if (!expert) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ expert });
}
