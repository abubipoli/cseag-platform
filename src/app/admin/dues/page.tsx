import { redirect } from "next/navigation";
import { getSession, roleAtLeast } from "@/lib/auth";
import DuesReport from "./DuesReport";

export default async function DuesPage() {
  const session = await getSession();
  if (!session || !roleAtLeast(session.role, "super_admin")) {
    redirect("/admin");
  }

  return <DuesReport />;
}
