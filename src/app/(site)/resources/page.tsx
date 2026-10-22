import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconFileText } from "@/components/ui/icons";
import { ResourceCard } from "@/components/ResourceCard";
import { listPublishedContent, getViewer } from "@/lib/content";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Download cybersecurity guides, policy templates, and training materials published by the Cyber Security Experts Association of Ghana (CSEAG).",
};
export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const viewer = await getViewer();
  const isMember = viewer.isMember;
  const items = await listPublishedContent("resource", viewer);

  return (
    <div>
      <PageHero
        kicker="Resource Library"
        title="Guides, templates &amp; training materials"
        description="Some resources are open to everyone; others are reserved for CSEAG members."
        image="/marketing/ethical-hacking.jpg"
        dark
        compact
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <EmptyState icon={<IconFileText className="h-5 w-5" />} title="No resources published yet" />
        ) : (
          <div className="space-y-6">
            {items.map((r) => (
              <ResourceCard key={r.id} item={r} locked={r.isMemberOnly && !isMember} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
