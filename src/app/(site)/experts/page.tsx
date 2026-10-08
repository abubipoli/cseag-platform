import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { listExperts } from "@/lib/experts";
import { ExpertsDirectoryClient } from "./ExpertsDirectoryClient";

export const metadata: Metadata = {
  title: "Expert Directory",
  description:
    "Browse CSEAG's directory of verified, certified cybersecurity professionals in Ghana — search by name, member ID or area of expertise to find a consultant, trainer, or specialist.",
};
export const dynamic = "force-dynamic";

// Server-rendered so the full expert list (names, roles, expertise) is
// present in the initial HTML for search engines — this page previously
// fetched everything client-side after mount, which meant crawlers saw an
// empty directory. The interactive search/filter still works exactly as
// before, layered on top in ExpertsDirectoryClient.
export default async function ExpertsPage() {
  const experts = await listExperts();

  return (
    <div>
      <PageHero
        kicker="Verified Professionals"
        title="Expert Directory"
        description="Search CSEAG's community of certified cybersecurity professionals by name, member ID or specialty."
        image="/marketing/cyber-security.jpg"
        dark
        compact
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <ExpertsDirectoryClient initialExperts={experts} />
      </section>
    </div>
  );
}
