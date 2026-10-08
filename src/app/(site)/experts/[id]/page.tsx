import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { IconBriefcase } from "@/components/ui/icons";
import { SidebarAd } from "@/components/marketing/SidebarAd";
import { SITE_CONFIG } from "@/lib/constants";
import { getExpertById } from "@/lib/experts";
import { ExpertContactButton } from "./ExpertContactButton";

export const dynamic = "force-dynamic";

function describeRole(expert: NonNullable<Awaited<ReturnType<typeof getExpertById>>>): string {
  return [expert.currentRole, expert.employer].filter(Boolean).join(" at ");
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const expert = await getExpertById(id);
  if (!expert) return { title: "Expert Not Found" };

  const role = describeRole(expert);
  const descriptionParts = [
    role && `${expert.name} — ${role}.`,
    expert.yearsOfExperience !== null && `${expert.yearsOfExperience} years of experience.`,
    expert.areasOfExpertise.length > 0 && `Areas of expertise: ${expert.areasOfExpertise.join(", ")}.`,
  ].filter(Boolean);
  const description =
    descriptionParts.join(" ") ||
    `${expert.name}'s verified profile in the CSEAG Expert Directory of cybersecurity professionals in Ghana.`;

  return {
    title: role ? `${expert.name} — ${role}` : expert.name,
    description,
    openGraph: {
      title: `${expert.name} | CSEAG Expert Directory`,
      description,
      images: expert.photoUrl ? [{ url: expert.photoUrl }] : undefined,
    },
  };
}

export default async function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await getExpertById(id);
  if (!expert) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: expert.name,
    jobTitle: expert.currentRole || undefined,
    worksFor: expert.employer ? { "@type": "Organization", name: expert.employer } : undefined,
    description: expert.bio || undefined,
    image: expert.photoUrl || undefined,
    knowsAbout: expert.areasOfExpertise.length > 0 ? expert.areasOfExpertise : undefined,
    url: `https://${SITE_CONFIG.domain}/experts/${expert.id}`,
    memberOf: { "@type": "Organization", name: SITE_CONFIG.fullName, url: `https://${SITE_CONFIG.domain}` },
  };

  return (
    <div className="bg-slate-50">
      {/* eslint-disable-next-line react/no-danger -- static JSON-LD built from server data, not user-supplied HTML */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
                  {describeRole(expert)}
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

          {expert.allowPublicContact && <ExpertContactButton expertId={expert.id} expertName={expert.name} />}
        </div>

        <div className="lg:-mt-24">
          <SidebarAd />
        </div>
      </div>
    </div>
  );
}
