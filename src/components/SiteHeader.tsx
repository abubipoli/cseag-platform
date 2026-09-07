import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: "var(--color-navy)" }}
          >
            CS
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-[var(--color-navy)]">CSEAG</span>
            <span className="block text-[11px] text-slate-500">Cyber Security Experts Assoc. Ghana</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 sm:flex">
          <Link href="/" className="hover:text-[var(--color-accent)]">
            Home
          </Link>
          <Link href="/experts" className="hover:text-[var(--color-accent)]">
            Experts
          </Link>
          <Link href="/apply" className="hover:text-[var(--color-accent)]">
            Membership
          </Link>
          {session && (
            <Link href="/dashboard" className="hover:text-[var(--color-accent)]">
              Dashboard
            </Link>
          )}
          {session && (session.role === "admin" || session.role === "super_admin" || session.role === "reviewer") && (
            <Link href="/admin" className="hover:text-[var(--color-accent)]">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <LogoutButton />
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-[var(--color-accent)]">
                Login
              </Link>
              <Link
                href="/apply"
                className="rounded-md px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                Apply Now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
