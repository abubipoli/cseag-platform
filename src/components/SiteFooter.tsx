import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-[var(--color-navy)]">CSEAG</p>
            <p className="mt-1">Cyber Security Experts Association of Ghana</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--color-navy)]">Contact</p>
            <p className="mt-1">info@cyberexpertgh.org</p>
            <p>+233 24 384 1842</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--color-navy)]">Quick links</p>
            <p className="mt-1">
              <Link href="/apply" className="hover:text-[var(--color-accent)]">
                Become a member
              </Link>
            </p>
            <p>
              <Link href="/experts" className="hover:text-[var(--color-accent)]">
                Expert directory
              </Link>
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} Cyber Security Experts Association of Ghana (CSEAG). All rights reserved.
        </p>
      </div>
    </footer>
  );
}
