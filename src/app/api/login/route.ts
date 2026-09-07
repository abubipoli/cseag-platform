import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password" }, { status: 422 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    await recordAudit({ actorUserId: user.id, action: "login.failed" });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(users.id, user.id));

  await setSessionCookie({ userId: user.id, role: user.role, email: user.email });
  await recordAudit({ actorUserId: user.id, action: "login.success" });

  return NextResponse.json({ ok: true, role: user.role });
}
