import Link from "next/link";
import { getSession } from "@/lib/auth";
import { roleAtLeast } from "@/lib/auth";
import { SITE_CONFIG } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/Button";
import HeaderMobileMenu from "./HeaderMobileMenu";
import LogoutButton from "./LogoutButton";
import { BrandMark } from "./BrandMark";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/what-we-do", label: "What We Do" },
  { href: "/experts", label: "Experts" },
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

export default async function SiteHeader() {
  const session = await getSession();
  const isStaff = !!session && roleAtLeast(session.role, "reviewer");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-10 w-10" />
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-navy-900">{SITE_CONFIG.name}</span>
            <span className="block text-[11px] text-slate-500">{SITE_CONFIG.fullName}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-accent-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {session ? (
            <>
              <ButtonLink href={isStaff ? "/admin" : "/dashboard"} variant="outline" size="sm">
                {isStaff ? "Admin" : "Dashboard"}
              </ButtonLink>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-accent-700">
                Login
              </Link>
              <ButtonLink href="/apply" size="sm">
                Apply Now
              </ButtonLink>
            </>
          )}
        </div>

        <HeaderMobileMenu
          navLinks={NAV_LINKS}
          isLoggedIn={!!session}
          dashboardHref={isStaff ? "/admin" : "/dashboard"}
          dashboardLabel={isStaff ? "Admin" : "Dashboard"}
        />
      </div>
    </header>
  );
}
