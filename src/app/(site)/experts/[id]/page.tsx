"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconBriefcase, IconMessageSquare } from "@/components/ui/icons";
import { SidebarAd } from "@/components/marketing/SidebarAd";
import RequestServiceModal from "./RequestServiceModal";

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
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/experts/${id}`)
      .then(async (r) => (r.ok ? (await r.json()).expert : null))
      .then(setExpert);
  }, [id]);

  if (expert === undefined) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-slate-500">Loading…</div>;
  }
  if (expert === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-slate-500">Expert not found.</p>
        <Link href="/experts" className="mt-3 inline-block text-sm font-medium text-accent-700">
          &larr; Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="h-44 bg-gradient-to-r from-navy-900 to-navy-700" />
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_260px]">
        <div className="-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
            <Avatar name={expert.name} photoUrl={expert.photoUrl} size="2xl" className="ring-4 ring-white" />
            <div>
              <h1 className="font-serif-display text-2xl text-navy-900">{expert.name}</h1>
              {expert.yearsOfExperience !== null && (
                <p className="text-sm text-slate-500">{expert.yearsOfExperience} years of experience</p>
              )}
              {(expert.employer || expert.currentRole) && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-500 sm:justify-start">
                  <IconBriefcase className="h-4 w-4" />
                  {[expert.currentRole, expert.employer].filter(Boolean).join(" at ")}
                </p>
              )}
            </div>
          </div>

          {expert.areasOfExpertise.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Areas of Expertise</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {expert.areasOfExpertise.map((a) => (
                  <Badge key={a} tone="accent">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {expert.bio && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Profile</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{expert.bio}</p>
            </div>
          )}

          {expert.certifications.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Certifications</p>
              <p className="mt-2 text-sm text-slate-700">{expert.certifications.join(", ")}</p>
            </div>
          )}

          {expert.allowPublicContact && (
            <Button onClick={() => setRequestOpen(true)} className="mt-8">
              <IconMessageSquare className="h-4 w-4" /> Request Service
            </Button>
          )}
        </div>

        <div className="lg:-mt-24">
          <SidebarAd />
        </div>
      </div>

      {requestOpen && (
        <RequestServiceModal expertId={expert.id} expertName={expert.name} onClose={() => setRequestOpen(false)} />
      )}
    </div>
  );
}
