import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import {
  IconGraduationCap,
  IconMessageSquare,
  IconShieldCheck,
  IconUsers,
  IconFileText,
  IconFlaskConical,
  IconArrowRight,
} from "@/components/ui/icons";

export const metadata: Metadata = { title: "What We Do" };

// The six focus areas and photos below are CSEAG's own, migrated from the
// matching "What We Do" section on cyberexpertgh.org.
const PROGRAMS = [
  {
    icon: IconShieldCheck,
    title: "Advocacy & Awareness",
    body: "Championing cybersecurity awareness for citizens and businesses, including our monthly awareness training covering practical cyber-hygiene and emerging threats.",
    image: "/content/advocacy-awareness.jpg",
  },
  {
    icon: IconGraduationCap,
    title: "Training & Certification",
    body: "Professional development, workshops, and industry-recognized certifications — including a hands-on OSINT programme for members working in investigations and threat intelligence.",
    image: "/content/training-certification.jpg",
  },
  {
    icon: IconFileText,
    title: "Policy Support",
    body: "Collaborating with regulators and policymakers to shape cybersecurity frameworks and legislation for Ghana.",
    image: "/content/policy-support.jpeg",
  },
  {
    icon: IconUsers,
    title: "Networking",
    body: "Connecting professionals and stakeholders across sectors for collaboration and knowledge sharing — including our verified Expert Directory.",
    image: "/content/networking.jpeg",
  },
  {
    icon: IconMessageSquare,
    title: "Incident Response & Support",
    body: "Fostering collaboration among cybersecurity professionals to strengthen collective incident response capacity nationwide.",
    image: "/content/incident-response.webp",
  },
  {
    icon: IconFlaskConical,
    title: "Cyber Security Research",
    body: "Advancing the field through publications and academic partnerships, in collaboration with Ghana's universities and research institutions.",
    image: "/content/cyber-research.jpg",
  },
];

export default function WhatWeDoPage() {
  return (
    <div>
      <PageHero
        kicker="What We Do"
        title="Programs built around Ghana's real cybersecurity needs"
        description="From hands-on training to public advocacy, everything CSEAG runs is designed to raise the standard of practice — and public trust — in Ghana's digital environment."
        image="/marketing/ai-network.jpg"
        dark
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p) => (
            <div
              key={p.title}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
            >
              <div className="relative h-36 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- static content photo, not worth next/image config for a fixed local asset */}
                <img src={p.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/0 to-navy-950/0" />
                <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-accent-700 shadow-sm">
                  <p.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-navy-900">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-700">Get involved</p>
          <h2 className="font-serif-display text-2xl text-navy-900 sm:text-3xl">See it in action</h2>
          <p className="max-w-xl text-slate-600">
            Browse upcoming training and events, or explore what our members have published in the resource
            library.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/events" className="inline-flex items-center gap-1.5 font-semibold text-accent-700 hover:text-accent-800">
              Upcoming events <IconArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/resources" className="inline-flex items-center gap-1.5 font-semibold text-accent-700 hover:text-accent-800">
              Resource library <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
