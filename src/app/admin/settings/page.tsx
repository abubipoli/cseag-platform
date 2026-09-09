import { redirect } from "next/navigation";
import { getSession, roleAtLeast } from "@/lib/auth";
import SettingsForm from "./SettingsForm";
import PaymentSettingsForm from "./PaymentSettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    redirect("/admin");
  }

  return (
    <div className="space-y-10">
      <SettingsForm />
      <div className="space-y-6 border-t border-slate-200 pt-8">
        <PaymentSettingsForm />
      </div>
    </div>
  );
}
