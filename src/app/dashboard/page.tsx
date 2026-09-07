"use client";

import { useEffect, useState } from "react";
import { AREAS_OF_EXPERTISE, MEMBERSHIP_CATEGORY_LABELS } from "@/lib/constants";

interface MeResponse {
  session: { userId: string; role: string; email: string };
  profile: Record<string, unknown> | null;
  application: { status: string; reviewerNotes?: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  more_info_requested: "More information requested",
  approved: "Approved",
  rejected: "Not approved",
};

export default function DashboardPage() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: MeResponse) => {
        setData(d);
        try {
          setExpertise(JSON.parse((d.profile?.areasOfExpertise as string) || "[]"));
        } catch {
          setExpertise([]);
        }
      });
  }, []);

  if (!data) return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Loading...</div>;
  if (!data.profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-slate-600">
          You need to be logged in to view your dashboard. <a href="/login" className="text-[var(--color-accent)]">Log in</a>.
        </p>
      </div>
    );
  }

  const { session, profile, application } = data;
  const isApplicantOnly = session.role === "applicant";

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: form.get("fullName"),
      phone: form.get("phone"),
      employer: form.get("employer"),
      currentRole: form.get("currentRole"),
      yearsOfExperience: form.get("yearsOfExperience") ? Number(form.get("yearsOfExperience")) : undefined,
      bio: form.get("bio"),
      areasOfExpertise: expertise,
      bioIsPublic: form.get("bioIsPublic") === "on",
      yearsOfExperienceIsPublic: form.get("yearsOfExperienceIsPublic") === "on",
      areasOfExpertiseIsPublic: form.get("areasOfExpertiseIsPublic") === "on",
      employerRoleIsPublic: form.get("employerRoleIsPublic") === "on",
      allowPublicContact: form.get("allowPublicContact") === "on",
    };
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-navy)]">My Dashboard</h1>

      {application && (
        <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Application status</p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-navy)]">
            {STATUS_LABEL[application.status] || application.status}
          </p>
          {application.reviewerNotes && (
            <p className="mt-2 text-sm text-slate-600">Note from the committee: {application.reviewerNotes}</p>
          )}
          {isApplicantOnly && (
            <p className="mt-2 text-xs text-slate-500">
              You have limited access while your application is under review. Full member features (including a
              public profile) unlock once you&rsquo;re approved.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-6 rounded-md border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-[var(--color-navy)]">My Information</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              name="fullName"
              defaultValue={(profile.fullName as string) || ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input
              name="phone"
              defaultValue={(profile.phone as string) || ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Employer</label>
            <input
              name="employer"
              defaultValue={(profile.employer as string) || ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Role / title</label>
            <input
              name="currentRole"
              defaultValue={(profile.currentRole as string) || ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Years of experience</label>
          <input
            name="yearsOfExperience"
            type="number"
            defaultValue={(profile.yearsOfExperience as number) ?? ""}
            className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={(profile.bio as string) || ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Areas of expertise</label>
          <div className="mt-2 grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-slate-200 p-3 sm:grid-cols-2">
            {AREAS_OF_EXPERTISE.map((area) => (
              <label key={area} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={expertise.includes(area)}
                  onChange={() =>
                    setExpertise((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
                  }
                  className="rounded border-slate-300"
                />
                {area}
              </label>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Membership category: <strong>{MEMBERSHIP_CATEGORY_LABELS[profile.membershipCategory as string]}</strong>
        </p>

        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-semibold text-[var(--color-navy)]">Public Profile Visibility</h3>
          <p className="mt-1 text-xs text-slate-600">
            Choose exactly what appears on your public profile in the Experts directory. Everything else stays
            private, visible only to CSEAG administrators. Your date of birth, national ID, and physical address
            are never shown publicly.
            {isApplicantOnly && " These choices take effect once your membership is approved."}
          </p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <Toggle name="bioIsPublic" label="Show my bio publicly" defaultChecked={!!profile.bioIsPublic} />
            <Toggle
              name="yearsOfExperienceIsPublic"
              label="Show my years of experience publicly"
              defaultChecked={!!profile.yearsOfExperienceIsPublic}
            />
            <Toggle
              name="areasOfExpertiseIsPublic"
              label="Show my areas of expertise publicly"
              defaultChecked={!!profile.areasOfExpertiseIsPublic}
            />
            <Toggle
              name="employerRoleIsPublic"
              label="Show my employer and role publicly"
              defaultChecked={!!profile.employerRoleIsPublic}
            />
            <Toggle
              name="allowPublicContact"
              label="Allow visitors to contact me through my public profile"
              defaultChecked={!!profile.allowPublicContact}
            />
          </div>
        </div>

        {saved && <p className="text-sm font-medium text-emerald-700">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="rounded border-slate-300" />
      {label}
    </label>
  );
}
