"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AREAS_OF_EXPERTISE } from "@/lib/constants";

interface Expert {
  id: string;
  name: string;
  yearsOfExperience: number | null;
  areasOfExpertise: string[];
  bio: string | null;
}

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-navy)]">Expert Directory</h1>
      <p className="mt-1 text-sm text-slate-600">
        Search CSEAG&rsquo;s community of certified cybersecurity professionals.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <input
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All areas of expertise</option>
          {AREAS_OF_EXPERTISE.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {experts.map((expert) => (
          <Link
            key={expert.id}
            href={`/experts/${expert.id}`}
            className="rounded-md border border-slate-200 bg-white p-4 hover:border-[var(--color-accent)]"
          >
            <p className="font-semibold text-[var(--color-navy)]">{expert.name}</p>
            {expert.yearsOfExperience !== null && (
              <p className="text-sm text-slate-500">{expert.yearsOfExperience} years of experience</p>
            )}
            {expert.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{expert.bio}</p>}
            {expert.areasOfExpertise.length > 0 && (
              <p className="mt-2 text-xs text-slate-400">{expert.areasOfExpertise.slice(0, 3).join(", ")}</p>
            )}
          </Link>
        ))}
        {experts.length === 0 && <p className="text-sm text-slate-500">No experts match that search yet.</p>}
      </div>
    </div>
  );
}
