import Link from "next/link";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/base-url";
import { IconArrowRight } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

async function getItem(slug: string) {
  const res = await fetch(`${await getBaseUrl()}/api/content/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.item;
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getItem(slug);
  if (!item || item.type !== "news") notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/news" className="text-sm font-medium text-accent-700 hover:text-accent-800">
        &larr; Back to News
      </Link>
      <p className="mt-6 text-xs font-medium text-slate-400">
        {new Date(item.publishedAt || item.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
      <h1 className="font-serif-display mt-2 text-3xl text-navy-900">{item.title}</h1>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- static content photo from local uploads/content dir
        <img src={item.imageUrl} alt="" className="mt-6 h-64 w-full rounded-2xl object-cover sm:h-80" />
      )}
      <div className="prose prose-slate mt-6 max-w-none whitespace-pre-line text-slate-700">{item.body}</div>

      <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="font-semibold text-navy-900">Stay in the loop</p>
        <p className="mt-1 text-sm text-slate-600">Follow more news and upcoming events from CSEAG.</p>
        <Link href="/events" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700">
          View upcoming events <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
