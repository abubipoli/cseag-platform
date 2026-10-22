"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AREAS_OF_EXPERTISE, GHANA_REGIONS, MEMBERSHIP_CATEGORY_LABELS, APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { FieldWrap, Input, PasswordInput, Select, Textarea, Checkbox, Switch } from "@/components/ui/Field";
import { PasswordRequirements, isStrongPassword } from "@/components/ui/PasswordRequirements";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ServiceRequestChat } from "@/components/ServiceRequestChat";
import { NewsBell } from "@/components/NewsBell";
import { NewsTicker } from "@/components/NewsTicker";
import { ResourceCard } from "@/components/ResourceCard";
import { MiniCalendar } from "@/components/ui/MiniCalendar";
import {
  IconBriefcase,
  IconCalendar,
  IconCheckCircle,
  IconClock,
  IconEdit,
  IconEye,
  IconFileText,
  IconLayoutDashboard,
  IconLock,
  IconMapPin,
  IconMessageSquare,
  IconShieldCheck,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";

interface Profile {
  fullName: string;
  membershipId: string | null;
  phone: string;
  region: string | null;
  employer: string | null;
  currentRole: string | null;
  yearsOfExperience: number | null;
  bio: string | null;
  areasOfExpertise: string;
  membershipCategory: string;
  photoUrl: string | null;
  bioIsPublic: boolean;
  photoIsPublic: boolean;
  yearsOfExperienceIsPublic: boolean;
  areasOfExpertiseIsPublic: boolean;
  employerRoleIsPublic: boolean;
  allowPublicContact: boolean;
  isListedInDirectory: boolean;
}

interface MeResponse {
  session: { userId: string; role: string; email: string };
  profile: Profile | null;
  application: { status: string; reviewerNotes?: string } | null;
  mfaEnabled: boolean;
}

type TabKey = "overview" | "profile" | "public" | "requests" | "events" | "dues" | "security" | "resources";

function DashboardPageInner() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<MeResponse | null>(null);
  const [tab, setTab] = useState<TabKey>((searchParams.get("tab") as TabKey) || "overview");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: MeResponse) => {
        setData(d);
        if (d.profile) {
          try {
            setExpertise(JSON.parse(d.profile.areasOfExpertise || "[]"));
          } catch {
            setExpertise([]);
          }
          setForm({
            fullName: d.profile.fullName || "",
            phone: d.profile.phone || "",
            region: d.profile.region || "",
            employer: d.profile.employer || "",
            currentRole: d.profile.currentRole || "",
            yearsOfExperience: d.profile.yearsOfExperience?.toString() || "",
            bio: d.profile.bio || "",
            photoUrl: d.profile.photoUrl || "",
            bioIsPublic: d.profile.bioIsPublic,
            photoIsPublic: d.profile.photoIsPublic,
            yearsOfExperienceIsPublic: d.profile.yearsOfExperienceIsPublic,
            areasOfExpertiseIsPublic: d.profile.areasOfExpertiseIsPublic,
            employerRoleIsPublic: d.profile.employerRoleIsPublic,
            allowPublicContact: d.profile.allowPublicContact,
            isListedInDirectory: d.profile.isListedInDirectory,
          });
        }
      });
  }, []);

  if (!data) return <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-slate-400">Loading…</div>;
  if (!data.profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-slate-600">
          You need to be logged in to view your dashboard.{" "}
          <a href="/login" className="font-medium text-accent-700">
            Log in
          </a>
          .
        </p>
      </div>
    );
  }

  const { session, profile, application } = data;
  const isApplicantOnly = session.role === "applicant";
  // Student members aren't shown the opt-in for the Experts directory — the
  // directory is meant for members offering services/expertise. Existing
  // eligibility checks (isActive, role, isListedInDirectory) are unchanged,
  // so a student already listed some other way stays listed.
  const isStudent = profile.membershipCategory === "student";
  // Applicants get status + account security only — everything else is a
  // member benefit that unlocks on approval (see the banner below).
  const effectiveTab: TabKey =
    isApplicantOnly && tab !== "overview" && tab !== "profile" && tab !== "security" ? "overview" : tab;
  const navItems: NavItem[] = isApplicantOnly
    ? [
        { value: "overview", label: "Overview", icon: IconLayoutDashboard },
        { value: "profile", label: "My Profile", icon: IconEdit },
        { value: "security", label: "Security", icon: IconLock },
      ]
    : [
        { value: "overview", label: "Overview", icon: IconLayoutDashboard },
        { value: "profile", label: "My Profile", icon: IconEdit },
        { value: "public", label: "Public Visibility", icon: IconEye },
        { value: "requests", label: "My Requests", icon: IconMessageSquare },
        { value: "events", label: "Events", icon: IconCalendar },
        { value: "dues", label: "Dues", icon: IconWallet },
        { value: "security", label: "Security", icon: IconLock },
        { value: "resources", label: "Resources", icon: IconFileText },
      ];

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    const payload = {
      ...form,
      // Region must be one of the fixed list or omitted — an empty string would
      // fail validation and reject the whole save.
      region: (form.region as string) || undefined,
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      areasOfExpertise: expertise,
    };
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const fields = body?.error?.fieldErrors ? Object.keys(body.error.fieldErrors) : [];
      setSaveError(
        res.status === 401
          ? "Your session has expired. Please log in again, then save."
          : fields.length > 0
            ? `Couldn't save — please check: ${fields.join(", ")}.`
            : "Couldn't save your changes. Please try again."
      );
      return;
    }
    if (res.ok) {
      setSaved(true);
      // Reflect the save immediately (header avatar, category badge, etc.)
      // without needing a full reload.
      setData((prev) =>
        prev?.profile
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                fullName: form.fullName as string,
                phone: form.phone as string,
                employer: form.employer as string,
                currentRole: form.currentRole as string,
                bio: form.bio as string,
                photoUrl: (form.photoUrl as string) || null,
                isListedInDirectory: (form.isListedInDirectory as boolean) || false,
              },
            }
          : prev
      );
    }
  }

  async function handlePhotoSelected(file: File) {
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    setUploadingPhoto(false);
    if (!res.ok) {
      setPhotoError("Couldn't upload that photo. Please try again.");
      return;
    }
    const uploadData = await res.json();
    setForm((f) => ({ ...f, photoUrl: uploadData.url }));
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Profile header — "tech blue" theme: deep navy-to-sky gradient,
          circuit-grid texture, soft glow accents drifting on the left/right
          edges, and a glass panel to lift the avatar/name/ID off the
          background. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-sky-900 pb-14 pt-8 text-white sm:pb-16">
        {/* Circuit texture wash */}
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-40" />

        {/* Decorative glows — left/right edges only, hidden on narrow screens
            so they never crowd the centered content column. */}
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
          <div className="animate-float-slow absolute -left-24 top-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
          <div
            className="animate-float-slow absolute -right-20 top-10 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl"
            style={{ animationDelay: "-3.5s" }}
          />
          {/* Thin circuit-line accents tracing the far edges */}
          <svg className="absolute -left-6 bottom-0 h-40 w-40 text-sky-400/25" viewBox="0 0 160 160" fill="none">
            <path d="M0 120h40l16-16h60" stroke="currentColor" strokeWidth="1.5" />
            <path d="M0 80h20l14 14v30" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="56" cy="104" r="3" fill="currentColor" />
            <circle cx="116" cy="104" r="3" fill="currentColor" />
            <circle cx="34" cy="94" r="3" fill="currentColor" />
          </svg>
          <svg className="absolute -right-6 top-6 h-40 w-40 text-sky-400/25" viewBox="0 0 160 160" fill="none">
            <path d="M160 20h-40l-16 16h-60" stroke="currentColor" strokeWidth="1.5" />
            <path d="M160 60h-20l-14 14v30" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="104" cy="36" r="3" fill="currentColor" />
            <circle cx="44" cy="36" r="3" fill="currentColor" />
            <circle cx="126" cy="74" r="3" fill="currentColor" />
          </svg>
        </div>

        <div className="absolute right-4 top-4 sm:right-6">
          <NewsBell />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm sm:flex-row sm:text-left">
            <Avatar
              name={profile.fullName}
              photoUrl={profile.photoUrl}
              size="xl"
              className="ring-4 ring-sky-400/40"
            />
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{profile.fullName}</h1>
              {profile.membershipId && (
                <p className="mt-0.5 text-sm text-white/60">
                  Member ID: <span className="font-mono tracking-wide text-sky-300/90">{profile.membershipId}</span>
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge tone="sky">{MEMBERSHIP_CATEGORY_LABELS[profile.membershipCategory] || "Member"}</Badge>
                {application && (
                  <Badge tone={statusTone(application.status)}>{APPLICATION_STATUS_LABELS[application.status]}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <NewsTicker />
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-6 max-w-6xl px-4 sm:px-6" id="dashboard-tabs">
        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <SideNav items={navItems} active={effectiveTab} onChange={setTab} />

          {/* relative: lets this column paint above the header it overlaps, like the sidebar */}
          <div className="relative min-w-0">
        {effectiveTab === "overview" && (
          <>
        <NextEventBanner canViewAll={!isApplicantOnly} onViewAll={() => setTab("events")} />

        {!isApplicantOnly && (
          <DuesCard
            onOpen={() => {
              setTab("dues");
              // Bring the Dues section into view — on a phone it starts below the fold.
              setTimeout(() => document.getElementById("dashboard-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
            }}
          />
        )}

        {application && isApplicantOnly && (
          <Card className="mb-6 border-amber-200 bg-amber-50/60">
            <CardBody className="flex items-start gap-3">
              <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-navy-900">Your application is {APPLICATION_STATUS_LABELS[application.status].toLowerCase()}</p>
                {application.reviewerNotes && <p className="mt-1 text-sm text-slate-600">Note: {application.reviewerNotes}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  You have limited access while under review. Full member features — including a public profile —
                  unlock once you&rsquo;re approved. If any of your details are wrong, you can correct them under{" "}
                  <button type="button" onClick={() => setTab("profile")} className="font-medium text-accent-700 underline">
                    My Profile
                  </button>
                  .
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickStat icon={<IconShieldCheck className="h-4 w-4" />} label="Status" value={isApplicantOnly ? "Applicant" : "Active"} />
          <QuickStat icon={<IconBriefcase className="h-4 w-4" />} label="Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} yrs` : "—"} />
          <QuickStat icon={<IconUsers className="h-4 w-4" />} label="Expertise" value={`${expertise.length} area(s)`} />
          <QuickStat icon={<IconEye className="h-4 w-4" />} label="Directory" value={profile.isListedInDirectory ? "Visible" : "Not yet"} />
        </div>
          </>
        )}

        <div className={effectiveTab === "overview" ? "mt-5" : ""}>
          {effectiveTab === "overview" && (
            <Card>
              <CardHeader>
                <p className="font-semibold text-navy-900">Membership overview</p>
              </CardHeader>
              <CardBody className="space-y-4 text-sm">
                <Row label="Full name" value={profile.fullName} />
                {profile.membershipId && <Row label="Member ID" value={profile.membershipId} />}
                <Row label="Email" value={session.email} />
                <Row label="Phone" value={profile.phone} />
                <Row label="Membership category" value={MEMBERSHIP_CATEGORY_LABELS[profile.membershipCategory] || "—"} />
                <Row label="Employer / role" value={[profile.currentRole, profile.employer].filter(Boolean).join(" at ") || "—"} />
              </CardBody>
            </Card>
          )}

          {effectiveTab === "profile" && (
            <Card>
              <CardHeader>
                <p className="font-semibold text-navy-900">Edit my information</p>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-5 sm:flex-row">
                  <Avatar name={(form.fullName as string) || profile.fullName} photoUrl={(form.photoUrl as string) || null} size="xl" />
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-accent-500 hover:text-accent-700">
                          {uploadingPhoto ? "Uploading..." : "Upload photo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={(e) => e.target.files?.[0] && handlePhotoSelected(e.target.files[0])}
                        />
                      </label>
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-accent-500 hover:text-accent-700">
                          {uploadingPhoto ? "Uploading..." : "Take photo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={(e) => e.target.files?.[0] && handlePhotoSelected(e.target.files[0])}
                        />
                      </label>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">JPG, PNG, or WebP. Saved when you click Save Changes below.</p>
                    {photoError && <p className="mt-1.5 text-xs text-red-600">{photoError}</p>}
                    {!isStudent && !isApplicantOnly && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1">
                        <Switch
                          label="Show this photo in the public Experts directory"
                          description="Off by default — your photo stays private until you turn this on and save."
                          checked={form.photoIsPublic as boolean}
                          onChange={(e) => setForm((f) => ({ ...f, photoIsPublic: e.target.checked }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrap label="Full name">
                    <Input value={form.fullName as string} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Phone">
                    <Input value={form.phone as string} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </FieldWrap>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrap label="Employer">
                    <Input value={form.employer as string} onChange={(e) => setForm((f) => ({ ...f, employer: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Role / title">
                    <Input value={form.currentRole as string} onChange={(e) => setForm((f) => ({ ...f, currentRole: e.target.value }))} />
                  </FieldWrap>
                </div>
                <FieldWrap label="Location (region)" hint="Where you are based in Ghana">
                  <Select
                    className="sm:w-64"
                    value={(form.region as string) || ""}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  >
                    <option value="">Select your location</option>
                    {GHANA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </FieldWrap>
                <FieldWrap label="Years of experience">
                  <Input
                    type="number"
                    className="sm:w-40"
                    value={form.yearsOfExperience as string}
                    onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: e.target.value }))}
                  />
                </FieldWrap>
                <FieldWrap label="Bio">
                  <Textarea rows={3} value={form.bio as string} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
                </FieldWrap>
                <FieldWrap label="Areas of expertise">
                  <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-3 scrollbar-thin sm:grid-cols-2">
                    {AREAS_OF_EXPERTISE.map((area) => (
                      <Checkbox
                        key={area}
                        label={area}
                        checked={expertise.includes(area)}
                        onChange={() => setExpertise((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))}
                      />
                    ))}
                  </div>
                </FieldWrap>
                <SaveBar saving={saving} saved={saved} error={saveError} onSave={handleSave} />
              </CardBody>
            </Card>
          )}

          {effectiveTab === "public" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <p className="font-semibold text-navy-900">Public profile visibility</p>
                </CardHeader>
                <CardBody>
                  <p className="text-xs text-slate-500">
                    Choose exactly what appears on your public profile in the Experts directory. Everything else
                    stays private. Your date of birth, national ID, and physical address are never shown publicly.
                    {isApplicantOnly && " These choices take effect once your membership is approved."}
                  </p>
                  <div className="mt-3 divide-y divide-slate-100">
                    {isStudent ? (
                      <p className="py-3 text-sm text-slate-500">
                        The Experts directory isn&apos;t available for student members.
                      </p>
                    ) : (
                      <Switch
                        label="List me in the public Experts directory"
                        description="Off by default. Turn this on when you're ready to appear in the directory — nothing is shown publicly until you do."
                        checked={form.isListedInDirectory as boolean}
                        onChange={(e) => setForm((f) => ({ ...f, isListedInDirectory: e.target.checked }))}
                      />
                    )}
                    <Switch
                      label="Show my profile picture publicly"
                      description="Off by default. Members who upload a photo won't appear with it in the directory until this is on."
                      checked={form.photoIsPublic as boolean}
                      onChange={(e) => setForm((f) => ({ ...f, photoIsPublic: e.target.checked }))}
                    />
                    <Switch
                      label="Show my bio publicly"
                      checked={form.bioIsPublic as boolean}
                      onChange={(e) => setForm((f) => ({ ...f, bioIsPublic: e.target.checked }))}
                    />
                    <Switch
                      label="Show my years of experience"
                      checked={form.yearsOfExperienceIsPublic as boolean}
                      onChange={(e) => setForm((f) => ({ ...f, yearsOfExperienceIsPublic: e.target.checked }))}
                    />
                    <Switch
                      label="Show my areas of expertise"
                      checked={form.areasOfExpertiseIsPublic as boolean}
                      onChange={(e) => setForm((f) => ({ ...f, areasOfExpertiseIsPublic: e.target.checked }))}
                    />
                    <Switch
                      label="Show my employer and role"
                      checked={form.employerRoleIsPublic as boolean}
                      onChange={(e) => setForm((f) => ({ ...f, employerRoleIsPublic: e.target.checked }))}
                    />
                    <Switch
                      label="Allow visitors to request my services"
                      description="Requests go to a CSEAG administrator first, who will follow up with you directly — your contact details are never shown or shared automatically."
                      checked={form.allowPublicContact as boolean}
                      onChange={(e) => setForm((f) => ({ ...f, allowPublicContact: e.target.checked }))}
                    />
                  </div>
                  <SaveBar saving={saving} saved={saved} error={saveError} onSave={handleSave} />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <p className="font-semibold text-navy-900">Live preview</p>
                </CardHeader>
                <CardBody>
                  <p className="mb-3 text-xs text-slate-500">This is what visitors will see on your public profile.</p>
                  <div className="rounded-xl border border-dashed border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={profile.fullName} photoUrl={form.photoIsPublic ? profile.photoUrl : null} />
                      <div>
                        <p className="font-semibold text-navy-900">{profile.fullName}</p>
                        {form.yearsOfExperienceIsPublic && profile.yearsOfExperience !== null && (
                          <p className="text-xs text-slate-500">{profile.yearsOfExperience} years of experience</p>
                        )}
                      </div>
                    </div>
                    {form.employerRoleIsPublic && (profile.currentRole || profile.employer) && (
                      <p className="mt-2 text-xs text-slate-500">
                        {[profile.currentRole, profile.employer].filter(Boolean).join(" at ")}
                      </p>
                    )}
                    {form.areasOfExpertiseIsPublic && expertise.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {expertise.slice(0, 4).map((a) => (
                          <Badge key={a} tone="accent">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {form.bioIsPublic && profile.bio && <p className="mt-3 text-sm text-slate-600">{profile.bio}</p>}
                    {!form.bioIsPublic && !form.areasOfExpertiseIsPublic && !form.employerRoleIsPublic && !form.yearsOfExperienceIsPublic && (
                      <p className="mt-3 text-sm text-slate-400">Your profile will show just your name for now.</p>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {effectiveTab === "requests" && <MyServiceRequests />}

          {effectiveTab === "events" && <UpcomingEvents />}

          {effectiveTab === "dues" && !isApplicantOnly && <MembershipDues />}

          {effectiveTab === "security" && (
            <div className="space-y-6">
              <PasswordSettings />
              <SecuritySettings initialEnabled={data.mfaEnabled} />
            </div>
          )}

          {effectiveTab === "resources" && <MemberResources />}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}

// The soonest upcoming event, placed at the top of the dashboard so members
// see it without opening the Events tab. Renders nothing when none is scheduled.
function NextEventBanner({ canViewAll, onViewAll }: { canViewAll: boolean; onViewAll: () => void }) {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/content?type=event")
      .then((r) => r.json())
      .then((d) => setEvents(d.items || []))
      .catch(() => setEvents([]));
  }, []);

  const upcoming = (events || [])
    .filter((e) => e.eventDate && new Date(e.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.eventDate as string).getTime() - new Date(b.eventDate as string).getTime());
  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const when = new Date(next.eventDate as string);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(when).setHours(0, 0, 0, 0) - startOfToday.getTime()) / 86400000);
  const countdown = days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-accent-200 bg-white shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-4 border-l-4 border-accent-500 p-4 sm:p-5">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-50 text-accent-700">
          <span className="text-[10px] font-bold uppercase leading-none">
            {when.toLocaleDateString("en-GB", { month: "short" })}
          </span>
          <span className="text-lg font-bold leading-tight">{when.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-accent-700">
            Next event
            <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[10px] text-navy-950">{countdown}</span>
          </p>
          <a href={`/events/${next.slug}`} className="mt-0.5 block font-semibold text-navy-900 hover:text-accent-700">
            {next.title}
          </a>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <IconCalendar className="h-3.5 w-3.5" />
              {when.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
            </span>
            {next.eventLocation && (
              <span className="flex items-center gap-1">
                <IconMapPin className="h-3.5 w-3.5" /> {next.eventLocation}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1.5 text-center sm:items-end">
          <a
            href={`/events/${next.slug}`}
            className="inline-flex items-center justify-center rounded-full bg-accent-500 px-4 py-1.5 text-xs font-semibold text-navy-950 hover:bg-accent-400"
          >
            View details
          </a>
          {canViewAll && upcoming.length > 1 && (
            <button type="button" onClick={onViewAll} className="text-xs font-medium text-accent-700 hover:text-accent-800">
              +{upcoming.length - 1} more upcoming
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Dues at a glance on the landing page. It only summarises; paying and the
// full payment history stay in the Dues tab, which this card opens.
function DuesCard({ onOpen }: { onOpen: () => void }) {
  const [dues, setDues] = useState<DuesStatus | null>(null);

  useEffect(() => {
    fetch("/api/member/dues/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDues(d))
      .catch(() => {});
  }, []);

  // Nothing owed for this category (e.g. staff with no category): no card.
  if (!dues || dues.duesAmountGhs <= 0) return null;

  const paidUp = dues.status === "paid";
  const pct = Math.min(100, Math.round((dues.totalPaidGhs / dues.duesAmountGhs) * 100));

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
      <div className={`flex flex-wrap items-center gap-4 border-l-4 p-4 sm:p-5 ${paidUp ? "border-accent-500" : "border-amber-400"}`}>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            paidUp ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-600"
          }`}
        >
          <IconWallet className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Membership dues &middot; {dues.year}
            <Badge tone={paidUp ? "accent" : dues.status === "partial" ? "amber" : "red"}>{DUES_STATUS_LABELS[dues.status]}</Badge>
          </p>
          <p className="mt-0.5 font-semibold text-navy-900">
            {paidUp
              ? `You're paid up (GHS ${dues.totalPaidGhs.toLocaleString()})`
              : `GHS ${dues.balanceGhs.toLocaleString()} outstanding of GHS ${dues.duesAmountGhs.toLocaleString()}`}
          </p>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${paidUp ? "bg-accent-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className={`inline-flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold ${
            paidUp
              ? "border border-slate-300 bg-white text-slate-700 hover:border-accent-500 hover:text-accent-700"
              : "bg-accent-500 text-navy-950 hover:bg-accent-400"
          }`}
        >
          {paidUp ? "View payment history" : "Pay dues"}
        </button>
      </div>
    </div>
  );
}

interface NavItem {
  value: TabKey;
  label: string;
  icon: (p: { className?: string }) => React.ReactNode;
}

// Section navigation: a sticky icon sidebar on large screens, and a
// horizontally scrolling icon bar above the content on phones/tablets.
function SideNav({ items, active, onChange }: { items: NavItem[]; active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav aria-label="Dashboard sections" className="mb-5 lg:sticky lg:top-24 lg:mb-0">
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[var(--shadow-card)] scrollbar-thin lg:flex-col lg:gap-1 lg:overflow-visible lg:p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors lg:w-full ${
                isActive
                  ? "bg-gradient-to-r from-navy-900 to-sky-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-navy-900"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-sky-300" : "text-slate-400"}`} />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-navy-900">{value}</span>
    </div>
  );
}

function SaveBar({ saving, saved, error, onSave }: { saving: boolean; saved: boolean; error?: string | null; onSave: () => void }) {
  return (
    <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
      <Button onClick={onSave} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
      {saved && (
        <span className="flex items-center gap-1 text-sm font-medium text-accent-700">
          <IconCheckCircle className="h-4 w-4" /> Saved
        </span>
      )}
      {error && <span className="text-sm font-medium text-red-600">{error}</span>}
    </div>
  );
}

interface ServiceRequestItem {
  id: string;
  ticketNumber: string;
  requesterName: string;
  message: string;
  status: "new" | "contacted" | "in_progress" | "resolved" | "declined";
  createdAt: string;
}

const REQUEST_STATUS_LABELS: Record<ServiceRequestItem["status"], string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In Progress",
  resolved: "Resolved",
  declined: "Declined",
};

function MyServiceRequests() {
  const [items, setItems] = useState<ServiceRequestItem[] | null>(null);
  const [active, setActive] = useState<ServiceRequestItem | null>(null);

  async function load() {
    const res = await fetch("/api/member/service-requests");
    const data = await res.json();
    setItems(data.requests || []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold text-navy-900">Requests assigned to me</p>
      </CardHeader>
      <CardBody>
        {!items ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IconMessageSquare className="h-5 w-5" />}
            title="No requests assigned yet"
            body="When an admin assigns you a service request, it'll show up here and you'll be notified by email and SMS."
          />
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <button key={r.id} onClick={() => setActive(r)} className="block w-full text-left">
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-md">
                  <Avatar name={r.requesterName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900">
                      <span className="mr-2 font-mono text-xs font-medium text-slate-500">{r.ticketNumber}</span>
                      {r.requesterName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{r.message}</p>
                  </div>
                  <Badge tone={statusTone(r.status)}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardBody>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active ? `${active.ticketNumber} · ${active.requesterName}` : ""} wide>
        {active && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="text-xs font-semibold uppercase text-slate-400">What they need</p>
              <p className="mt-1 italic text-slate-600">&ldquo;{active.message}&rdquo;</p>
            </div>
            <ServiceRequestChat serviceRequestId={active.id} />
          </div>
        )}
      </Drawer>
    </Card>
  );
}

interface EventItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  imageUrl: string | null;
}

function UpcomingEvents() {
  const [items, setItems] = useState<EventItem[] | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/content?type=event")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, []);

  const upcoming = (items || []).filter((e) => !e.eventDate || new Date(e.eventDate).getTime() >= now);

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold text-navy-900">Upcoming CSEAG events</p>
      </CardHeader>
      <CardBody className="space-y-5">
        {items && upcoming.length > 0 && (
          <MiniCalendar eventDates={upcoming.filter((e) => e.eventDate).map((e) => e.eventDate as string)} />
        )}
        {!items ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : upcoming.length === 0 ? (
          <EmptyState icon={<IconCalendar className="h-5 w-5" />} title="No upcoming events" body="Check back soon for new training dates." />
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => (
              <a
                key={e.id}
                href={`/events/${e.slug}`}
                className="flex gap-4 rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-md"
              >
                {e.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small thumbnail from arbitrary uploaded/local content asset
                  <img src={e.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                    <IconCalendar className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-navy-900">{e.title}</p>
                  {e.summary && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{e.summary}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
                    {e.eventDate && (
                      <span className="flex items-center gap-1">
                        <IconCalendar className="h-3.5 w-3.5" />
                        {new Date(e.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                    {e.eventLocation && (
                      <span className="flex items-center gap-1">
                        <IconMapPin className="h-3.5 w-3.5" /> {e.eventLocation}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

interface DuesPaymentItem {
  id: string;
  amountGhs: number;
  method: "paystack" | "manual";
  status: "pending" | "success" | "failed";
  createdAt: string;
}

interface DuesStatus {
  year: string;
  duesAmountGhs: number;
  totalPaidGhs: number;
  balanceGhs: number;
  creditGhs: number;
  status: "paid" | "partial" | "unpaid";
  payments: DuesPaymentItem[];
  paystackReady: boolean;
}

const DUES_STATUS_LABELS: Record<DuesStatus["status"], string> = { paid: "Paid up", partial: "Partially paid", unpaid: "Not paid" };

function MembershipDues() {
  const searchParams = useSearchParams();
  const [dues, setDues] = useState<DuesStatus | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const paymentResult = searchParams.get("payment");

  useEffect(() => {
    fetch("/api/member/dues/status")
      .then((r) => r.json())
      .then((d: DuesStatus) => {
        setDues(d);
        setPayAmount(d.balanceGhs ? String(d.balanceGhs) : "");
      });
  }, []);

  async function handlePay() {
    setPaying(true);
    setPayError(null);
    const res = await fetch("/api/member/dues/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountGhs: payAmount ? Number(payAmount) : undefined }),
    });
    const data = await res.json();
    setPaying(false);
    if (res.ok && data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
    } else {
      setPayError(data.error || "Couldn't start payment. Please try again.");
    }
  }

  if (!dues) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-400">Loading…</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold text-navy-900">Membership dues — {dues.year}</p>
      </CardHeader>
      <CardBody className="space-y-5">
        {paymentResult === "success" && (
          <p className="rounded-lg bg-accent-50 px-4 py-2.5 text-sm text-accent-800">Payment received — thank you!</p>
        )}
        {paymentResult === "failed" && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            That payment didn&rsquo;t go through. You can try again below.
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
          <div>
            <p className="text-xs text-slate-400">Amount due</p>
            <p className="mt-0.5 font-semibold text-navy-900">GHS {dues.duesAmountGhs.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Paid</p>
            <p className="mt-0.5 font-semibold text-navy-900">GHS {dues.totalPaidGhs.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Balance</p>
            <p className="mt-0.5 font-semibold text-navy-900">GHS {dues.balanceGhs.toLocaleString()}</p>
          </div>
        </div>

        {dues.creditGhs > 0 && (
          <p className="rounded-lg bg-sky-50 px-4 py-2.5 text-sm text-sky-800">
            You&rsquo;ve paid GHS {dues.creditGhs.toLocaleString()} more than this year&rsquo;s dues. It&rsquo;s recorded
            as credit on your account &mdash; thank you.
          </p>
        )}

        <Badge tone={dues.status === "paid" ? "accent" : dues.status === "partial" ? "amber" : "red"}>
          {DUES_STATUS_LABELS[dues.status]}
        </Badge>

        {dues.status !== "paid" &&
          (dues.paystackReady ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount to pay now</label>
              <p className="mb-2 text-xs text-slate-500">
                Pay in full or in installments — enter any amount up to your GHS {dues.balanceGhs.toLocaleString()} balance.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-40">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">GHS</span>
                  <Input
                    type="number"
                    min={1}
                    max={dues.balanceGhs}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="pl-11"
                  />
                </div>
                <Button
                  onClick={handlePay}
                  disabled={paying || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > dues.balanceGhs}
                >
                  {paying ? "Redirecting..." : "Pay with Paystack"}
                </Button>
              </div>
              {payError && <p className="mt-2 text-xs text-red-600">{payError}</p>}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Online payment isn&rsquo;t set up yet — contact CSEAG to pay another way.</p>
          ))}

        {dues.payments.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Payment history</p>
            <div className="mt-2 space-y-2">
              {dues.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                    {p.method === "paystack" ? "Paystack" : "Manual"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-navy-900">GHS {p.amountGhs.toLocaleString()}</span>
                    <Badge tone={statusTone(p.status === "success" ? "active" : p.status === "failed" ? "inactive" : "pending")}>
                      {p.status}
                    </Badge>
                    {p.status === "success" && (
                      <a
                        href={`/api/member/dues/${p.id}/receipt`}
                        className="text-xs font-medium text-accent-700 hover:underline"
                      >
                        Receipt
                      </a>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isStrongPassword(newPassword)) {
      setError("Choose a new password that meets all the requirements below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/member/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSubmitting(false);

    if (res.ok) {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(typeof data?.error === "string" ? data.error : "Couldn't update your password. Check the fields and try again.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold text-navy-900">Password</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">Password updated.</p>}

          <FieldWrap label="Current password" required>
            <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </FieldWrap>
          <FieldWrap label="New password" required>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={10} />
            <PasswordRequirements password={newPassword} />
          </FieldWrap>
          <FieldWrap label="Confirm new password" required>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </FieldWrap>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Update password"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

type MfaStep = "idle" | "enrolling" | "backup_codes" | "disabling";

function SecuritySettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<MfaStep>("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startEnrollment() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me/mfa/setup", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't start setup. Try again.");
      return;
    }
    const data = await res.json();
    setQrCodeDataUrl(data.qrCodeDataUrl);
    setSecret(data.secret);
    setStep("enrolling");
  }

  async function confirmEnrollment() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "That code isn't valid.");
      return;
    }
    setBackupCodes(data.backupCodes);
    setEnabled(true);
    setStep("backup_codes");
    setCode("");
  }

  async function confirmDisable() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me/mfa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "That code isn't valid.");
      return;
    }
    setEnabled(false);
    setStep("idle");
    setCode("");
  }

  function finishBackupCodes() {
    setStep("idle");
    setQrCodeDataUrl(null);
    setSecret(null);
    setBackupCodes(null);
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold text-navy-900">Two-factor authentication</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {step === "idle" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  Add a second step to your login using an authenticator app (Google Authenticator, Authy, Microsoft
                  Authenticator, etc.).
                </p>
              </div>
              <Badge tone={enabled ? "accent" : "neutral"}>{enabled ? "Enabled" : "Off"}</Badge>
            </div>
            {enabled ? (
              <Button variant="outline" onClick={() => setStep("disabling")}>
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={startEnrollment} disabled={busy}>
                {busy ? "Starting..." : "Enable 2FA"}
              </Button>
            )}
          </>
        )}

        {step === "disabling" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Enter your current code (or a backup code) to confirm turning 2FA off.</p>
            <Input value={code} onChange={(e) => setCode(e.target.value)} autoFocus inputMode="numeric" className="sm:w-48" />
            <div className="flex gap-2">
              <Button variant="danger" onClick={confirmDisable} disabled={busy || !code}>
                {busy ? "Disabling..." : "Confirm disable"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("idle");
                  setCode("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "enrolling" && qrCodeDataUrl && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Scan this QR code with your authenticator app, or enter the key manually, then enter the 6-digit code it
              shows you.
            </p>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element -- locally-generated data: URI QR code */}
              <img src={qrCodeDataUrl} alt="2FA enrollment QR code" className="h-40 w-40" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-slate-400">Manual entry key</p>
                <p className="mt-1 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{secret}</p>
              </div>
            </div>
            <FieldWrap label="6-digit code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} autoFocus inputMode="numeric" className="sm:w-48" />
            </FieldWrap>
            <div className="flex gap-2">
              <Button onClick={confirmEnrollment} disabled={busy || !code}>
                {busy ? "Verifying..." : "Verify & turn on"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("idle");
                  setCode("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "backup_codes" && backupCodes && (
          <div className="space-y-4">
            <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-800">2FA is now on.</p>
            <div>
              <p className="text-sm font-medium text-navy-900">Save these backup codes somewhere safe</p>
              <p className="mt-1 text-xs text-slate-500">
                Each one can be used once to log in if you lose access to your authenticator app. They&rsquo;re only shown
                now.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-700 sm:grid-cols-4">
                {backupCodes.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </div>
            <Button onClick={finishBackupCodes}>I&rsquo;ve saved these — Done</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

interface ResourceItem {
  id: string;
  title: string;
  summary: string | null;
  fileUrl: string | null;
  isMemberOnly: boolean;
  publishedAt: string | null;
  createdAt: string | null;
}

function MemberResources() {
  const [items, setItems] = useState<ResourceItem[] | null>(null);

  useEffect(() => {
    fetch("/api/content?type=resource")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, []);

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold text-navy-900">Member resources</p>
      </CardHeader>
      <CardBody>
        {!items ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">No resources published yet.</p>
        ) : (
          <div className="space-y-5">
            {items.map((r) => (
              <ResourceCard key={r.id} item={r} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
