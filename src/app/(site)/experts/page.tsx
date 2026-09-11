"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AREAS_OF_EXPERTISE } from "@/lib/constants";
import { PageHero } from "@/components/marketing/PageHero";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { IconSearch, IconUsers, IconBriefcase, IconEye } from "@/components/ui/icons";

interface Expert {
  id: string;
  name: string;
  photoUrl: string | null;
  yearsOfExperience: number | null;
  employer: string | null;
  currentRole: string | null;
  areasOfExpertise: string[];
  bio: string | null;
}

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[] | null>(null);
  const [q, setQ] = useState("");
  const [expertise, setExpertise] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (expertise) params.set("expertise", expertise);
    fetch(`/api/experts?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setExperts(d.experts || []));
  }, [q, expertise]);

  return (
    <div>
      <PageHero
        kicker="Verified Professionals"
        title="Expert Directory"
        description="Search CSEAG's community of certified cybersecurity professionals by name or specialty."
        image="/marketing/cyber-security.jpg"
        dark
        compact
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          <Select value={expertise} onChange={(e) => setExpertise(e.target.value)} className="sm:w-72">
            <option value="">All areas of expertise</option>
            {AREAS_OF_EXPERTISE.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-8">
          {experts === null ? (
            <p className="text-sm text-slate-400">Loading experts…</p>
          ) : experts.length === 0 ? (
            <EmptyState icon={<IconUsers className="h-5 w-5" />} title="No experts match that search" body="Try a different name or area of expertise." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {experts.map((expert) => (
                <Link
                  key={expert.id}
                  href={`/experts/${expert.id}`}
                  className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative">
                    <Avatar name={expert.name} photoUrl={expert.photoUrl} size="xl" />
                    {/* "click to view more" affordance: a soft overlay that only
                        appears on hover, so the grid stays clean at rest but
                        clearly invites a click once you're looking at a card. */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-navy-900/0 opacity-0 transition-all duration-200 group-hover:bg-navy-900/50 group-hover:opacity-100">
                      <IconEye className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="mt-3 font-semibold text-navy-900 group-hover:text-accent-700">{expert.name}</p>
                  {expert.yearsOfExperience !== null && (
                    <p className="text-xs text-slate-500">{expert.yearsOfExperience} years of experience</p>
                  )}
                  {(expert.currentRole || expert.employer) && (
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                      <IconBriefcase className="h-3.5 w-3.5 shrink-0" />
                      <span>{[expert.currentRole, expert.employer].filter(Boolean).join(" at ")}</span>
                    </p>
                  )}
                  {expert.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{expert.bio}</p>}
                  {expert.areasOfExpertise.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {expert.areasOfExpertise.slice(0, 2).map((a) => (
                        <Badge key={a} tone="accent">
                          {a}
                        </Badge>
                      ))}
                      {expert.areasOfExpertise.length > 2 && (
                        <Badge>+{expert.areasOfExpertise.length - 2} more</Badge>
                      )}
                    </div>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-700 opacity-0 transition-opacity group-hover:opacity-100">
                    View profile
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 8h8M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
