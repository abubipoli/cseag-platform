import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import TemplatesForm from "./TemplatesForm";

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "settings"))) {
    redirect("/admin");
  }

  return <TemplatesForm />;
}
