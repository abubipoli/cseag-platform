import { redirect } from "next/navigation";
import { getSession, roleAtLeast } from "@/lib/auth";
import TemplatesForm from "./TemplatesForm";

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    redirect("/admin");
  }

  return <TemplatesForm />;
}
