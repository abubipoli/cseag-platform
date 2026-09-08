import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconShieldCheck,
  IconUsers,
  IconGraduationCap,
  IconTarget,
  IconFileText,
} from "@/components/ui/icons";
import { getBaseUrl } from "@/lib/base-url";
import { HeroSlideshow } from "@/components/marketing/HeroSlideshow";

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
  ["Integrity", "Honesty, transparency, and accountability in cybersecurity practice."],
  ["Professionalism", "Excellence, competence, and reliability."],
  ["Collaboration", "A united front across sectors and disciplines."],
  ["Continuous Learning", "Staying ahead of an ever-evolving threat landscape."],
  ["Public Service", "Promoting digital safety for every Ghanaian."],
];

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
  try {
    const res = await fetch(`${await getBaseUrl()}/api/content?type=news`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).slice(0, 3);
  } catch {
    return [];
  }
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
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-300">
            <IconShieldCheck className="h-3.5 w-3.5" />
            Cyber Security Experts Association of Ghana
          </p>
          <h1
            className="font-serif-display mt-6 text-4xl leading-[1.1] tracking-tight sm:text-6xl"
            style={{ textShadow: "0 2px 16px rgba(2, 6, 15, 0.65)" }}
          >
            A united front of cybersecurity professionals, securing Ghana&rsquo;s digital future.
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg"
            style={{ textShadow: "0 1px 10px rgba(2, 6, 15, 0.6)" }}
          >
            Join a trusted community of certified experts, share knowledge, and help shape a safer digital
            Ghana.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/apply" size="lg">
              Apply for Membership <IconArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/experts" variant="outline-light" size="lg">
              Browse the Expert Directory
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          <Stat icon={<IconUsers className="h-5 w-5" />} label="Specialty areas" value="32" />
          <Stat icon={<IconTarget className="h-5 w-5" />} label="Focus" value="Nationwide" />
          <Stat icon={<IconGraduationCap className="h-5 w-5" />} label="Training" value="Monthly" />
          <Stat icon={<IconShieldCheck className="h-5 w-5" />} label="Standard" value="Verified" />
        </div>
      </section>

      {/* Core values */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-600">What we stand for</p>
          <h2 className="font-serif-display mt-2 text-2xl text-navy-900 sm:text-3xl">Our Core Values</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg">
              <p className="font-semibold text-navy-900">{title}</p>
              <p className="mt-2 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* President quote */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <blockquote className="font-serif-display text-xl text-navy-900 sm:text-2xl">
            &ldquo;Cybersecurity is not a battle won by one person, but a war fought by united experts.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm font-semibold text-slate-500">— Abubakar Issaka, President, CSEAG</p>
        </div>
      </section>

      {/* Latest news */}
      {news.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-display text-2xl text-navy-900">Latest News</h2>
              <Link href="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700">
                View all <IconArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {news.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg"
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden bg-slate-50">
        <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-accent-100/70 blur-[100px]" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-serif-display text-2xl text-navy-900 sm:text-3xl">Ready to join CSEAG?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Whether you&rsquo;re a student, a working professional, or represent an organization, there&rsquo;s a
            place for you. Apply online and hear back from our membership committee — you&rsquo;ll get an
            immediate email and SMS confirmation the moment you apply.
          </p>
          <ButtonLink href="/apply" size="lg" className="mt-7">
            Start Your Application
          </ButtonLink>
        </div>
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
