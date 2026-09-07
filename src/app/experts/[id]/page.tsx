"use client";

import { useEffect, useState, use as usePromise } from "react";

interface Expert {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  employer: string | null;
  currentRole: string | null;
  areasOfExpertise: string[];
  certifications: string[];
  allowPublicContact: boolean;
}

export default function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [expert, setExpert] = useState<Expert | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/experts/${id}`)
      .then(async (r) => (r.ok ? (await r.json()).expert : null))
      .then(setExpert);
  }, [id]);

  if (expert === undefined) return <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-slate-500">Loading...</div>;
  if (expert === null) return <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-slate-500">Expert not found.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-md border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-[var(--color-navy)]">{expert.name}</h1>
        {expert.yearsOfExperience !== null && (
          <p className="mt-1 text-sm text-slate-500">{expert.yearsOfExperience} years of experience</p>
        )}
        {(expert.employer || expert.currentRole) && (
          <p className="mt-1 text-sm text-slate-500">
            {[expert.currentRole, expert.employer].filter(Boolean).join(" at ")}
          </p>
        )}

        {expert.areasOfExpertise.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Areas of Expertise</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {expert.areasOfExpertise.map((a) => (
                <span key={a} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {expert.bio && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Profile</p>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{expert.bio}</p>
          </div>
        )}

        {expert.certifications.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Certifications</p>
            <p className="mt-2 text-sm text-slate-700">{expert.certifications.join(", ")}</p>
          </div>
        )}

        {expert.allowPublicContact && (
          <button
            className="mt-6 rounded-md px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            Send Message
          </button>
        )}
      </div>
    </div>
  );
}
