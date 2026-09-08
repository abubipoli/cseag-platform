import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { SITE_CONFIG } from "@/lib/constants";
import { IconMail, IconMapPin, IconPhone } from "@/components/ui/icons";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div>
      <PageHero
        kicker="Get in touch"
        title="Contact CSEAG"
        description="Questions about membership, training, or working with our experts? Send us a message and the right team will get back to you."
        compact
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-5">
            <ContactDetail icon={<IconMail className="h-5 w-5" />} label="Email" value={SITE_CONFIG.email} href={`mailto:${SITE_CONFIG.email}`} />
            <ContactDetail icon={<IconPhone className="h-5 w-5" />} label="Phone" value={SITE_CONFIG.phone} href={`tel:${SITE_CONFIG.phoneHref}`} />
            <ContactDetail icon={<IconMapPin className="h-5 w-5" />} label="Address" value={SITE_CONFIG.address} />
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}

function ContactDetail({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
        {icon}
      </span>
      <span>
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="mt-0.5 block font-medium text-navy-900">{value}</span>
      </span>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}
