import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { IconFileText, IconDownload, IconLock } from "@/components/ui/icons";
import { getSession } from "@/lib/auth";
import { listPublishedContent } from "@/lib/content";

export const metadata: Metadata = { title: "Resources" };
export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const session = await getSession();
  const isMember = !!session && session.role !== "applicant";
  const items = await listPublishedContent("resource", isMember);

  return (
    <div>
      <PageHero
        kicker="Resource Library"
        title="Guides, templates &amp; training materials"
        description="Some resources are open to everyone; others are reserved for CSEAG members."
        compact
      />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <EmptyState icon={<IconFileText className="h-5 w-5" />} title="No resources published yet" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((r) => {
              const locked = r.isMemberOnly && !isMember;
              return (
                <div key={r.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                    <IconFileText className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-navy-900">{r.title}</p>
                      {r.isMemberOnly && <Badge tone="navy">Members only</Badge>}
                    </div>
                    {r.summary && <p className="mt-1 text-sm text-slate-600">{r.summary}</p>}
                    <div className="mt-3">
                      {locked ? (
                        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-accent-700">
                          <IconLock className="h-4 w-4" /> Log in to access
                        </Link>
                      ) : r.fileUrl ? (
                        <a href={r.fileUrl} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 hover:text-accent-800">
                          <IconDownload className="h-4 w-4" /> Download
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">No file attached</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
