import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCalendar, IconMapPin, IconArrowRight } from "@/components/ui/icons";
import { listPublishedContent } from "@/lib/content";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

type EventItem = Awaited<ReturnType<typeof listPublishedContent>>[number];

export default async function EventsPage() {
  const items = await listPublishedContent("event", false);
  // This page is force-dynamic (rendered fresh per request), so reading the
  // current time here is the intended behavior, not an accidental impurity.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const upcoming = items.filter((e) => !e.eventDate || new Date(e.eventDate).getTime() >= now);
  const past = items.filter((e) => e.eventDate && new Date(e.eventDate).getTime() < now);

  return (
    <div>
      <PageHero
        kicker="Training &amp; Events"
        title="Upcoming Events"
        description="Awareness training, OSINT programmes, and community meetups — open to members and, where noted, the public."
        compact
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {upcoming.length === 0 ? (
          <EmptyState icon={<IconCalendar className="h-5 w-5" />} title="No upcoming events" body="Check back soon — new training dates are announced regularly." />
        ) : (
          <div className="space-y-4">
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-14">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Past events</h2>
            <div className="mt-4 space-y-4 opacity-70">
              {past.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function EventRow({ event }: { event: EventItem }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg sm:flex-row sm:items-center"
    >
      {event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- static content photo from local uploads/content dir
        <img src={event.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      ) : event.eventDate ? (
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-900 text-white">
          <span className="text-xs font-medium uppercase">
            {new Date(event.eventDate).toLocaleDateString("en-GB", { month: "short" })}
          </span>
          <span className="text-xl font-bold leading-none">{new Date(event.eventDate).getDate()}</span>
        </div>
      ) : null}
      <div className="flex-1">
        <h3 className="font-semibold text-navy-900 group-hover:text-accent-700">{event.title}</h3>
        {event.summary && <p className="mt-1 text-sm text-slate-600">{event.summary}</p>}
        {event.eventLocation && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <IconMapPin className="h-3.5 w-3.5" /> {event.eventLocation}
          </p>
        )}
      </div>
      <IconArrowRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-accent-700" />
    </Link>
  );
}
