import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession, roleAtLeast } from "@/lib/auth";
import { db } from "@/db/client";
import { memberProfiles } from "@/db/schema";
import { ROLE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function AdminProfilePage() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "reviewer")) {
    redirect("/login");
  }

  const profile = await db.query.memberProfiles.findFirst({ where: eq(memberProfiles.userId, session.userId) });

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="My Account" description="Manage your own admin login." />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <p className="font-semibold text-navy-900">{profile?.fullName || session.email}</p>
        <p className="mt-0.5 text-slate-500">
          {session.email} · {ROLE_LABELS[session.role] || session.role}
        </p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
