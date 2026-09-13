import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";

// Defense-in-depth: the login page already redirects to /change-password
// when mustChangePassword is set, but this catches direct navigation or a
// bookmarked /dashboard link before that change is made.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) {
    const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (user?.mustChangePassword) redirect("/change-password");
  }
  return children;
}
