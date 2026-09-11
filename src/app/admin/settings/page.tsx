import { redirect } from "next/navigation";
import { getSession, roleAtLeast } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import SettingsForm from "./SettingsForm";
import PaymentSettingsForm from "./PaymentSettingsForm";
import RolePermissionsForm from "./RolePermissionsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "settings"))) {
    redirect("/admin");
  }

  // Roles & permissions is a hardcoded super_admin-only section, separate
  // from the "settings" permission above — see the permissions API route
  // for why it can't be delegated via the matrix itself.
  const canManageRoles = roleAtLeast(session.role, "super_admin");

  return (
    <div className="space-y-10">
      <SettingsForm />
      <div className="space-y-6 border-t border-slate-200 pt-8">
        <PaymentSettingsForm />
      </div>
      {canManageRoles && (
        <div className="space-y-6 border-t border-slate-200 pt-8">
          <RolePermissionsForm />
        </div>
      )}
    </div>
  );
}
