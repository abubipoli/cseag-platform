import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import { IconMail, IconMapPin, IconPhone } from "@/components/ui/icons";
import NewsletterForm from "./NewsletterForm";
import { BrandMark } from "./BrandMark";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark className="h-9 w-9" />
              <span className="text-sm font-bold text-white">{SITE_CONFIG.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">{SITE_CONFIG.tagline}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <FooterLink href="/about" label="About CSEAG" />
              <FooterLink href="/what-we-do" label="What We Do" />
              <FooterLink href="/experts" label="Expert Directory" />
              <FooterLink href="/news" label="News" />
              <FooterLink href="/events" label="Events" />
              <FooterLink href="/resources" label="Resources" />
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Membership</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <FooterLink href="/apply" label="Become a member" />
              <FooterLink href="/login" label="Member login" />
              <FooterLink href="/contact" label="Contact us" />
            </ul>

            <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-500">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <IconMail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-accent-400">
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <IconPhone className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <a href={`tel:${SITE_CONFIG.phoneHref}`} className="hover:text-accent-400">
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <span>{SITE_CONFIG.address}</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Stay updated</p>
            <p className="mt-4 text-sm text-slate-400">
              Get notified about training, OSINT programmes, and association news.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE_CONFIG.fullName}. All rights reserved.
          </p>
          <p>Secured &amp; monitored to the standard we ask of our members.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="text-slate-400 transition-colors hover:text-accent-400">
        {label}
      </Link>
    </li>
  );
}
