"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SITE_CONFIG, ROLE_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import LogoutButton from "@/components/LogoutButton";
import { BrandMark } from "@/components/BrandMark";
import {
  IconLayoutDashboard,
  IconUsers,
  IconClipboard,
  IconFileText,
  IconMessageSquare,
  IconMail,
  IconBarChart,
  IconHistory,
  IconSettings,
  IconMenu,
  IconX,
  IconExternalLink,
  IconCheckCircle,
  IconUserCheck,
} from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: IconLayoutDashboard, exact: true },
  { href: "/admin/applications", label: "Applications", icon: IconClipboard },
  { href: "/admin/service-requests", label: "Service Requests", icon: IconMessageSquare },
  { href: "/admin/members", label: "Members", icon: IconUsers },
  { href: "/admin/content", label: "Content", icon: IconFileText },
  { href: "/admin/communications", label: "Communications", icon: IconMail },
  { href: "/admin/reports", label: "Reports", icon: IconBarChart },
  { href: "/admin/audit-log", label: "Audit Log", icon: IconHistory },
];

// Live email/SMS credentials — restricted to super admins, same as granting
// admin access itself.
const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/admin/dues", label: "Dues", icon: IconCheckCircle },
  { href: "/admin/settings", label: "Settings", icon: IconSettings },
];

// The admin back office ("member management platform") pairs a dark
// instrument-panel sidebar — in the spirit of Twingate's own product design
// (see styles.refero.design/twingate) — with a bright, high-contrast work
// surface for the content itself, so long admin sessions stay easy to read
// while the sidebar still gives staff a clear "you're in the back office"
// cue distinct from the public site.
export function AdminShell({
  children,
  fullName,
  email,
  role,
}: {
  children: React.ReactNode;
  fullName: string;
  email: string;
  role: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const navItems = role === "super_admin" ? [...NAV, ...SUPER_ADMIN_NAV] : NAV;

  const sidebarContent = (
    <>
      <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
        <BrandMark className="h-9 w-9" />
        <span>
          <span className="font-display-light block text-sm text-white">{SITE_CONFIG.name} Admin</span>
          <span className="block text-[11px] text-white/35">Control room</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-accent-500/15 text-accent-300" : "text-white/50 hover:bg-white/6 hover:text-white"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/8 px-3 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-white/40 hover:bg-white/6 hover:text-white"
        >
          <IconUserCheck className="h-4.5 w-4.5" />
          My member dashboard
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-white/40 hover:bg-white/6 hover:text-white"
        >
          <IconExternalLink className="h-4.5 w-4.5" />
          View public site
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-paper-alt">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-900 lg:flex print:hidden">{sidebarContent}</aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-navy-900">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-full p-1.5 text-white/40 hover:bg-white/8"
            >
              <IconX className="h-5 w-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md print:hidden sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
            <IconMenu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-navy-900">{fullName}</p>
              <p className="text-xs text-slate-400">
                {ROLE_LABELS[role] || role} · {email}
              </p>
            </div>
            <Avatar name={fullName} size="sm" />
            <LogoutButton className="ml-1" />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
