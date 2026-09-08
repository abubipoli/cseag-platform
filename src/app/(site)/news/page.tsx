import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconFileText, IconArrowRight } from "@/components/ui/icons";
import { getBaseUrl } from "@/lib/base-url";

export const metadata: Metadata = { title: "News" };
export const dynamic = "force-dynamic";

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

async function getNews(): Promise<NewsItem[]> {
  const res = await fetch(`${await getBaseUrl()}/api/content?type=news`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export default async function NewsPage() {
  const items = await getNews();

  return (
    <div>
      <PageHero kicker="Newsroom" title="News &amp; Updates" description="Announcements, association news, and coverage from CSEAG." compact />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <EmptyState icon={<IconFileText className="h-5 w-5" />} title="No news posts yet" body="Check back soon for updates." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg"
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- static content photo from local uploads/content dir
                  <img src={item.imageUrl} alt="" className="h-40 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-medium text-slate-400">
                    {new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-navy-900 group-hover:text-accent-700">{item.title}</h2>
                  {item.summary && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.summary}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-700">
                    Read more <IconArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
