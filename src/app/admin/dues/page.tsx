import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import DuesReport from "./DuesReport";

export default async function DuesPage() {
  const session = await getSession();
  if (!(await hasPermission(session, "dues"))) {
    redirect("/admin");
  }

  return <DuesReport />;
}
