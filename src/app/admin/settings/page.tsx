import { redirect } from "next/navigation";
import { getSession, roleAtLeast } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    redirect("/admin");
  }

  return <SettingsForm />;
}
