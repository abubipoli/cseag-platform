import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { IconTarget, IconGlobe, IconUsers, IconShieldCheck } from "@/components/ui/icons";

export const metadata: Metadata = { title: "About Us" };

const VALUES = [
  ["Integrity", "Honesty, transparency, and accountability in cybersecurity practice."],
  ["Professionalism", "Excellence, competence, and reliability in everything our members do."],
  ["Collaboration", "A united front across sectors, disciplines, and institutions."],
  ["Continuous Learning", "Staying ahead of an ever-evolving threat landscape."],
  ["Public Service", "Promoting digital safety and awareness for every Ghanaian."],
];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        kicker="About CSEAG"
        title="A professional home for Ghana's cybersecurity community"
        description="The Cyber Security Experts Association of Ghana unites practitioners, researchers, and organizations working to make Ghana's digital environment safer."
        image="/hero/summit-7.jpg"
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent-600">Who we are</p>
            <h2 className="font-serif-display mt-2 text-2xl text-navy-900 sm:text-3xl">
              Certified professionals, working together for a safer digital Ghana
            </h2>
            <p className="mt-4 text-slate-600">
              CSEAG brings together cybersecurity practitioners from finance, telecommunications, government,
              academia, and independent practice. We set a shared standard of professionalism, share knowledge
              across sectors, and speak with one voice on the issues that matter to Ghana&rsquo;s digital future —
              from incident response and critical infrastructure protection to public awareness and policy
              development.
            </p>
            <p className="mt-4 text-slate-600">
              Membership is built on verified experience and a shared code of conduct, so anyone who works with a
              CSEAG member — or finds one through our public Expert Directory — can trust the credential.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 self-start">
            <StatTile icon={<IconUsers className="h-5 w-5" />} label="Member community" value="20+ experts" />
            <StatTile icon={<IconGlobe className="h-5 w-5" />} label="Coverage" value="Nationwide" />
            <StatTile icon={<IconShieldCheck className="h-5 w-5" />} label="Focus" value="32 specialty areas" />
            <StatTile icon={<IconTarget className="h-5 w-5" />} label="Mission" value="Public digital safety" />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-600">Mission</p>
            <p className="mt-3 text-slate-600">
              To foster a community of cybersecurity professionals dedicated to innovation, ethical practice, and
              proactive defense against evolving cyber threats.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-600">Vision</p>
            <p className="mt-3 text-slate-600">
              To be the primary driver of a secure and resilient digital ecosystem throughout Ghana — safeguarding
              digital rights, privacy, and data integrity for every citizen and institution.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-600">What we stand for</p>
            <h2 className="font-serif-display mt-2 text-2xl text-navy-900 sm:text-3xl">Our Core Values</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {VALUES.map(([title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <p className="font-semibold text-navy-900">{title}</p>
                <p className="mt-2 text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element -- static leadership photo, not worth next/image config */}
            <img
              src="/uploads/abubakar-issaka.jpg"
              alt="Abubakar Issaka, President of CSEAG"
              className="h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-[var(--shadow-card)]"
            />
            <blockquote className="font-serif-display mt-6 text-xl text-navy-900 sm:text-2xl">
              &ldquo;Cybersecurity is not a battle won by one person, but a war fought by united experts.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-slate-500">— Abubakar Issaka, President, CSEAG</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-[var(--shadow-card)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static content photo, not worth next/image config */}
            <img src="/content/community-event.jpg" alt="CSEAG members at a cybersecurity conference" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-50 py-14 text-center">
        <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative">
          <h2 className="font-serif-display text-2xl text-navy-900">Want to be part of it?</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Applications are reviewed by our membership committee and typically decided within a few business days.
          </p>
          <ButtonLink href="/apply" className="mt-6" size="lg">
            Apply for Membership
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">{icon}</div>
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="font-semibold text-navy-900">{value}</p>
    </div>
  );
}
