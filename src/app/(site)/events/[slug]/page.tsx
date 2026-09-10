import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPublishedContentBySlug } from "@/lib/content";
import { IconCalendar, IconMapPin, IconLock } from "@/components/ui/icons";
import { SidebarAd } from "@/components/marketing/SidebarAd";
import RsvpForm from "./RsvpForm";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const isMember = !!session && session.role !== "applicant";
  const item = await getPublishedContentBySlug(slug, isMember);
  if (!item || item.type !== "event") notFound();

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_260px]">
      <article>
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
          {isMember ? (
            <RsvpForm eventId={item.id} eventTitle={item.title} />
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <IconLock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-navy-900">RSVP is for CSEAG members</p>
                <p className="mt-1 text-sm text-slate-600">
                  {session ? (
                    "Your account needs to be an approved member to RSVP."
                  ) : (
                    <>
                      <Link href="/login" className="font-medium text-accent-700 hover:text-accent-800">
                        Log in
                      </Link>{" "}
                      as a member to RSVP for this event.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </article>

      <SidebarAd />
    </div>
  );
}
