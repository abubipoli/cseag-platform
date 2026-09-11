import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconShieldCheck,
  IconUsers,
  IconGraduationCap,
  IconTarget,
  IconFileText,
  IconBriefcase,
  IconGlobe,
} from "@/components/ui/icons";
import { HeroSlideshow } from "@/components/marketing/HeroSlideshow";
import { Reveal } from "@/components/ui/Reveal";
import { listPublishedContent } from "@/lib/content";

export const dynamic = "force-dynamic";

const HERO_IMAGES = [
  "/hero/summit-1.jpg",
  "/hero/summit-2.jpg",
  "/hero/summit-3.jpg",
  "/hero/summit-4.jpg",
  "/hero/summit-5.jpg",
  "/hero/summit-6.jpg",
  "/hero/summit-7.jpg",
  "/hero/summit-8.jpg",
  "/hero/summit-9.jpg",
];

const VALUES = [
  {
    title: "Integrity",
    body: "Honesty, transparency, and accountability in cybersecurity practice.",
    icon: IconShieldCheck,
    color: "sky",
  },
  {
    title: "Professionalism",
    body: "Excellence, competence, and reliability.",
    icon: IconBriefcase,
    color: "indigo",
  },
  {
    title: "Collaboration",
    body: "A united front across sectors and disciplines.",
    icon: IconUsers,
    color: "accent",
  },
  {
    title: "Continuous Learning",
    body: "Staying ahead of an ever-evolving threat landscape.",
    icon: IconGraduationCap,
    color: "amber",
  },
  {
    title: "Public Service",
    body: "Promoting digital safety for every Ghanaian.",
    icon: IconGlobe,
    color: "rose",
  },
] as const;

const VALUE_COLORS: Record<string, { bar: string; chip: string; icon: string }> = {
  sky: { bar: "bg-sky-500", chip: "bg-sky-50", icon: "text-sky-600" },
  indigo: { bar: "bg-indigo-500", chip: "bg-indigo-50", icon: "text-indigo-600" },
  accent: { bar: "bg-accent-500", chip: "bg-accent-50", icon: "text-accent-600" },
  amber: { bar: "bg-amber-500", chip: "bg-amber-50", icon: "text-amber-600" },
  rose: { bar: "bg-rose-500", chip: "bg-rose-50", icon: "text-rose-600" },
};

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

async function getLatestNews(): Promise<NewsItem[]> {
  const items = await listPublishedContent("news", false);
  return items.slice(0, 3);
}

export default async function HomePage() {
  const news = await getLatestNews();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <HeroSlideshow images={HERO_IMAGES} />
        <div className="absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 left-[-10%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-28">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-300">
              <IconShieldCheck className="h-3.5 w-3.5" />
              Cyber Security Experts Association of Ghana
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1
              className="font-serif-display mt-6 text-4xl leading-[1.1] tracking-tight sm:text-6xl"
              style={{ textShadow: "0 2px 16px rgba(2, 6, 15, 0.65)" }}
            >
              A united front of cybersecurity professionals, securing Ghana&rsquo;s digital future.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p
              className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg"
              style={{ textShadow: "0 1px 10px rgba(2, 6, 15, 0.6)" }}
            >
              Join a trusted community of certified experts, share knowledge, and help shape a safer digital
              Ghana.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/apply" size="lg">
                Apply for Membership <IconArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/experts" variant="outline-light" size="lg">
                Browse the Expert Directory
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Circuit video band */}
      <section className="relative isolate overflow-hidden bg-navy-950 py-14 text-center text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          src="/hero/circuit-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/50 to-navy-950/80" aria-hidden />
        <Reveal className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <p className="font-serif-display text-xl sm:text-2xl">Real-time vigilance. Nationwide reach.</p>
          <p className="mt-3 text-sm text-white/70">
            CSEAG members actively monitor, respond to, and share intelligence on the threats facing Ghana&rsquo;s
            digital infrastructure — every day, across every sector.
          </p>
        </Reveal>
      </section>

      {/* Stats strip */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          <Reveal>
            <Stat icon={<IconUsers className="h-5 w-5" />} label="Specialty areas" value="32" />
          </Reveal>
          <Reveal delay={80}>
            <Stat icon={<IconTarget className="h-5 w-5" />} label="Focus" value="Nationwide" />
          </Reveal>
          <Reveal delay={160}>
            <Stat icon={<IconGraduationCap className="h-5 w-5" />} label="Training" value="Monthly" />
          </Reveal>
          <Reveal delay={240}>
            <Stat icon={<IconShieldCheck className="h-5 w-5" />} label="Standard" value="Verified" />
          </Reveal>
        </div>
      </section>

      {/* Core values */}
      <section className="relative overflow-hidden bg-white py-16">
        <div className="bg-dot-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-600">What we stand for</p>
            <h2 className="font-serif-display mt-2 text-2xl text-navy-900 sm:text-3xl">Our Core Values</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {VALUES.map((v, i) => {
              const c = VALUE_COLORS[v.color];
              return (
                <Reveal key={v.title} delay={i * 80}>
                  <div className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className={`h-1 w-full ${c.bar}`} aria-hidden />
                    <div className="p-5">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.chip} ${c.icon} transition-transform group-hover:scale-110`}
                      >
                        <v.icon className="h-5 w-5" />
                      </span>
                      <p className="font-serif-display mt-4 text-lg text-navy-900">{v.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* President quote */}
      <section className="bg-slate-50 py-16">
        <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <blockquote className="font-serif-display text-xl text-navy-900 sm:text-2xl">
            &ldquo;Cybersecurity is not a battle won by one person, but a war fought by united experts.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm font-semibold text-slate-500">— Abubakar Issaka, President, CSEAG</p>
        </Reveal>
      </section>

      {/* Latest news */}
      {news.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal className="flex items-center justify-between">
              <h2 className="font-serif-display text-2xl text-navy-900">Latest News</h2>
              <Link href="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700">
                View all <IconArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {news.map((item, i) => (
                <Reveal key={item.id} delay={i * 100}>
                  <Link
                    href={`/news/${item.slug}`}
                    className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- static content photo from local uploads/content dir
                      <img src={item.imageUrl} alt="" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-slate-50">
                        <IconFileText className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs text-slate-400">
                        {new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="mt-2 font-semibold text-navy-900">{item.title}</p>
                      {item.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.summary}</p>}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative section backdrop photo */}
        <img
          src="/marketing/cyber-security.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/85 to-navy-950/70" aria-hidden />
        <div className="absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-accent-500/20 blur-[100px]" aria-hidden />
        <Reveal className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-serif-display text-2xl sm:text-3xl">Ready to join CSEAG?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Whether you&rsquo;re a student, a working professional, or represent an organization, there&rsquo;s a
            place for you. Apply online and hear back from our membership committee — you&rsquo;ll get an
            immediate email and SMS confirmation the moment you apply.
          </p>
          <ButtonLink href="/apply" size="lg" className="mt-7">
            Start Your Application
          </ButtonLink>
        </Reveal>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">{icon}</span>
      <div className="mt-2 sm:mt-0">
        <p className="text-lg font-bold text-navy-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
