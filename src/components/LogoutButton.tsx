"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconLogOut } from "@/components/ui/icons";

export default function LogoutButton({ className, showIcon }: { className?: string; showIcon?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={cn("inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-accent-700", className)}
    >
      {showIcon && <IconLogOut className="h-4 w-4" />}
      Log out
    </button>
  );
}
