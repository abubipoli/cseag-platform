import Link from "next/link";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/base-url";
import { IconCalendar, IconMapPin } from "@/components/ui/icons";
import RsvpForm from "./RsvpForm";

export const dynamic = "force-dynamic";

async function getItem(slug: string) {
  const res = await fetch(`${await getBaseUrl()}/api/content/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.item;
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getItem(slug);
  if (!item || item.type !== "event") notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/events" className="text-sm font-medium text-accent-700 hover:text-accent-800">
        &larr; Back to Events
      </Link>

      <h1 className="font-serif-display mt-6 text-3xl text-navy-900">{item.title}</h1>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
        {item.eventDate && (
          <span className="flex items-center gap-1.5">
            <IconCalendar className="h-4 w-4" />
            {new Date(item.eventDate).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
          </span>
        )}
        {item.eventLocation && (
          <span className="flex items-center gap-1.5">
            <IconMapPin className="h-4 w-4" /> {item.eventLocation}
          </span>
        )}
      </div>

      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- static content photo from local uploads/content dir
        <img src={item.imageUrl} alt="" className="mt-6 h-64 w-full rounded-2xl object-cover sm:h-80" />
      )}

      <div className="prose prose-slate mt-6 max-w-none whitespace-pre-line text-slate-700">{item.body}</div>

      <div className="mt-10">
        <RsvpForm eventId={item.id} eventTitle={item.title} />
      </div>
    </article>
  );
}
