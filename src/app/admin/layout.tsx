import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession, roleAtLeast } from "@/lib/auth";
import { getEffectivePermissions } from "@/lib/permissions";
import { db } from "@/db/client";
import { memberProfiles } from "@/db/schema";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    redirect("/login");
  }

  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, session.userId) });
  const permissions = await getEffectivePermissions(session);

  return (
    <AdminShell fullName={profile?.fullName || "Admin"} email={session.email} role={session.role} permissions={permissions}>
      {children}
    </AdminShell>
  );
}
