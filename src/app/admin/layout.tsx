import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession, roleAtLeast } from "@/lib/auth";
import { db } from "@/db/client";
import { memberProfiles } from "@/db/schema";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    redirect("/login");
  }

  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, session.userId) });

  return (
    <AdminShell fullName={profile?.fullName || "Admin"} email={session.email} role={session.role}>
      {children}
    </AdminShell>
  );
}
