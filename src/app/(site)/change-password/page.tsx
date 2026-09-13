import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-center text-2xl font-bold text-navy-900">Set a new password</h1>
      <p className="mt-1 text-center text-sm text-slate-600">
        For your security, you need to change your temporary password before continuing.
      </p>
      <ChangePasswordForm role={session.role} />
    </div>
  );
}
