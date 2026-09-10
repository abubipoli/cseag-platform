"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { IconMenu, IconX } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/Button";
import LogoutButton from "./LogoutButton";

export default function HeaderMobileMenu({
  navLinks,
  isLoggedIn,
  dashboardHref,
  dashboardLabel,
  memberDashboardHref,
}: {
  navLinks: { href: string; label: string }[];
  isLoggedIn: boolean;
  dashboardHref: string;
  dashboardLabel: string;
  // Staff (reviewer/admin/super_admin) get an "Admin" button as their main
  // dashboard link — this gives them a second way to reach their own member
  // dashboard too, since they otherwise have no path to it in the header.
  memberDashboardHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="xl:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
      >
        <IconMenu className="h-6 w-6" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-navy-950/40 backdrop-blur-[1px]" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-navy-900">Menu</span>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1 text-sm font-medium text-slate-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 hover:bg-slate-50 hover:text-accent-700"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5">
              {isLoggedIn ? (
                <>
                  <ButtonLink href={dashboardHref} onClick={() => setOpen(false)}>
                    {dashboardLabel}
                  </ButtonLink>
                  {memberDashboardHref && (
                    <ButtonLink
                      href={memberDashboardHref}
                      variant="outline"
                      onClick={() => setOpen(false)}
                      className="w-full justify-center"
                    >
                      My Member Dashboard
                    </ButtonLink>
                  )}
                  <LogoutButton className="w-full justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-accent-500 hover:text-accent-700" />
                </>
              ) : (
                <>
                  <ButtonLink href="/apply" onClick={() => setOpen(false)}>
                    Apply Now
                  </ButtonLink>
                  <ButtonLink href="/login" variant="outline" onClick={() => setOpen(false)}>
                    Login
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
}
