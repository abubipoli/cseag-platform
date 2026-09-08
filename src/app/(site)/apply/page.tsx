"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AREAS_OF_EXPERTISE,
  MEMBERSHIP_CATEGORY_LABELS,
  TITLE_OPTIONS,
  AGE_GROUPS,
  GHANA_REGIONS,
  CSA_ACCREDITATION_TIERS,
  CSA_ACCREDITATION_TIER_LABELS,
} from "@/lib/constants";
import { PageHero } from "@/components/marketing/PageHero";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, Input, Select, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconCheckCircle, IconChevronRight } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

// Corporate membership is handled separately (SRS 6.11), not via self-service application.
const CATEGORIES = Object.entries(MEMBERSHIP_CATEGORY_LABELS).filter(([value]) => value !== "corporate");
const STEPS = ["Account", "Professional Background", "Review & Submit"];

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [isEmployed, setIsEmployed] = useState(true);
  const [csaAccredited, setCsaAccredited] = useState(false);

  const [fields, setFields] = useState({
    title: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
    ageGroup: "",
    region: "",
    employer: "",
    currentRole: "",
    yearsOfExperience: "",
    highestCertificate: "",
    certifications: "",
    csaAccreditationTier: "",
    membershipCategory: "associate",
    codeOfConductAccepted: false,
    privacyConsentAccepted: false,
  });

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function toggleExpertise(area: string) {
    setExpertise((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  const stepErrors = useMemo(() => {
    if (step === 0) {
      const e: string[] = [];
      if (!fields.title) e.push("Select a title.");
      if (fields.fullName.trim().length < 2) e.push("Enter your full name.");
      if (!/^\S+@\S+\.\S+$/.test(fields.email)) e.push("Enter a valid email address.");
      if (fields.password.length < 8) e.push("Password must be at least 8 characters.");
      if (fields.phone.trim().length < 9) e.push("Enter a valid mobile number.");
      if (!fields.ageGroup) e.push("Select an age group.");
      if (!fields.region) e.push("Select a region.");
      return e;
    }
    if (step === 1) {
      const e: string[] = [];
      if (!fields.highestCertificate.trim()) e.push("Enter your highest certificate obtained.");
      if (csaAccredited && !fields.csaAccreditationTier) e.push("Select your Cyber Security Authority accreditation tier.");
      if (expertise.length === 0) e.push("Select at least one area of expertise.");
      return e;
    }
    if (step === 2) {
      const e: string[] = [];
      if (!fields.codeOfConductAccepted) e.push("You must accept the Code of Conduct.");
      if (!fields.privacyConsentAccepted) e.push("You must accept the privacy notice.");
      return e;
    }
    return [];
  }, [step, fields, expertise, csaAccredited]);

  function goNext() {
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);

    const payload = {
      title: fields.title,
      fullName: fields.fullName,
      email: fields.email,
      password: fields.password,
      phone: fields.phone,
      ageGroup: fields.ageGroup,
      region: fields.region,
      employer: isEmployed ? fields.employer || undefined : undefined,
      currentRole: isEmployed ? fields.currentRole || undefined : undefined,
      yearsOfExperience: fields.yearsOfExperience ? Number(fields.yearsOfExperience) : undefined,
      highestCertificate: fields.highestCertificate,
      certifications: fields.certifications
        ? fields.certifications.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
      csaAccredited,
      csaAccreditationTier: csaAccredited ? fields.csaAccreditationTier : undefined,
      areasOfExpertise: expertise,
      membershipCategory: fields.membershipCategory,
      codeOfConductAccepted: fields.codeOfConductAccepted,
      privacyConsentAccepted: fields.privacyConsentAccepted,
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.ok) {
      router.push("/dashboard?justApplied=1");
      router.refresh();
      return;
    }

    const data = await res.json().catch(() => ({}));
    const messages: string[] = [];
    if (data?.error?.formErrors) messages.push(...data.error.formErrors);
    if (data?.error?.fieldErrors) {
      for (const [, msgs] of Object.entries(data.error.fieldErrors as Record<string, string[]>)) {
        messages.push(...(msgs as string[]));
      }
    }
    if (typeof data?.error === "string") messages.push(data.error);
    setErrors(messages.length ? messages : ["Something went wrong. Please try again."]);
  }

  return (
    <div>
      <PageHero
        kicker="Membership Application"
        title="Become a CSEAG Member"
        description="Takes about 5 minutes. You'll get an email and SMS confirmation the moment you submit, and hear back from our membership committee soon after."
        compact
      />

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Stepper */}
        <ol className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    i < step
                      ? "bg-accent-500 text-navy-900"
                      : i === step
                        ? "bg-navy-900 text-white"
                        : "bg-slate-100 text-slate-400"
                  )}
                >
                  {i < step ? <IconCheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn("hidden text-center text-[11px] font-medium sm:block", i <= step ? "text-navy-900" : "text-slate-400")}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-2 h-0.5 flex-1 rounded-full", i < step ? "bg-accent-500" : "bg-slate-200")} />
              )}
            </li>
          ))}
        </ol>

        {errors.length > 0 && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-50 p-3 text-sm text-red-700">
            <ul className="list-inside list-disc space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <Card className="mt-6">
          <CardBody>
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                  <FieldWrap label="Title" required>
                    <Select value={fields.title} onChange={(e) => set("title", e.target.value)}>
                      <option value="">Select</option>
                      {TITLE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </FieldWrap>
                  <FieldWrap label="Full name" required>
                    <Input value={fields.fullName} onChange={(e) => set("fullName", e.target.value)} required />
                  </FieldWrap>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrap label="Email address" required>
                    <Input type="email" value={fields.email} onChange={(e) => set("email", e.target.value)} required />
                  </FieldWrap>
                  <FieldWrap label="Mobile number (for SMS)" required hint="e.g. +233241234567">
                    <Input value={fields.phone} onChange={(e) => set("phone", e.target.value)} required />
                  </FieldWrap>
                </div>
                <FieldWrap label="Create a password" required hint="At least 8 characters.">
                  <Input type="password" value={fields.password} onChange={(e) => set("password", e.target.value)} required minLength={8} />
                </FieldWrap>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrap label="Age group" required>
                    <Select value={fields.ageGroup} onChange={(e) => set("ageGroup", e.target.value)}>
                      <option value="">Select</option>
                      {AGE_GROUPS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </Select>
                  </FieldWrap>
                  <FieldWrap label="Region" required>
                    <Select value={fields.region} onChange={(e) => set("region", e.target.value)}>
                      <option value="">Select</option>
                      {GHANA_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </FieldWrap>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <FieldWrap label="Are you currently working for an institution?">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" name="isEmployed" checked={isEmployed} onChange={() => setIsEmployed(true)} />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" name="isEmployed" checked={!isEmployed} onChange={() => setIsEmployed(false)} />
                      No
                    </label>
                  </div>
                </FieldWrap>
                {isEmployed && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldWrap label="Which institution?">
                      <Input value={fields.employer} onChange={(e) => set("employer", e.target.value)} />
                    </FieldWrap>
                    <FieldWrap label="Current position in the institution">
                      <Input value={fields.currentRole} onChange={(e) => set("currentRole", e.target.value)} />
                    </FieldWrap>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrap label="Years of cybersecurity experience">
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      value={fields.yearsOfExperience}
                      onChange={(e) => set("yearsOfExperience", e.target.value)}
                    />
                  </FieldWrap>
                  <FieldWrap label="Membership category" required>
                    <Select value={fields.membershipCategory} onChange={(e) => set("membershipCategory", e.target.value)}>
                      {CATEGORIES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </FieldWrap>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldWrap label="Highest certificate obtained" required hint="e.g. BSc Computer Science">
                    <Input value={fields.highestCertificate} onChange={(e) => set("highestCertificate", e.target.value)} />
                  </FieldWrap>
                  <FieldWrap label="Cyber security certificate(s) obtained" hint="Comma-separated, e.g. CEH, CompTIA Security+">
                    <Input value={fields.certifications} onChange={(e) => set("certifications", e.target.value)} />
                  </FieldWrap>
                </div>
                <FieldWrap label="Are you accredited by the Cyber Security Authority?">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" name="csaAccredited" checked={csaAccredited} onChange={() => setCsaAccredited(true)} />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="csaAccredited"
                        checked={!csaAccredited}
                        onChange={() => {
                          setCsaAccredited(false);
                          set("csaAccreditationTier", "");
                        }}
                      />
                      No
                    </label>
                  </div>
                </FieldWrap>
                {csaAccredited && (
                  <FieldWrap label="Accreditation tier" required>
                    <Select value={fields.csaAccreditationTier} onChange={(e) => set("csaAccreditationTier", e.target.value)}>
                      <option value="">Select</option>
                      {CSA_ACCREDITATION_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {CSA_ACCREDITATION_TIER_LABELS[tier]}
                        </option>
                      ))}
                    </Select>
                  </FieldWrap>
                )}
                <FieldWrap label="Areas of expertise" required hint={`${expertise.length} selected`}>
                  <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-3 scrollbar-thin sm:grid-cols-2">
                    {AREAS_OF_EXPERTISE.map((area) => (
                      <Checkbox
                        key={area}
                        label={area}
                        checked={expertise.includes(area)}
                        onChange={() => toggleExpertise(area)}
                      />
                    ))}
                  </div>
                </FieldWrap>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-navy-900">{fields.fullName || "—"}</p>
                  <p>{fields.email} · {fields.phone}</p>
                  <p className="mt-1">{MEMBERSHIP_CATEGORY_LABELS[fields.membershipCategory]} membership</p>
                  <p className="mt-1">{expertise.length} area(s) of expertise selected</p>
                </div>
                <Checkbox
                  label="I accept the CSEAG Code of Conduct."
                  checked={fields.codeOfConductAccepted}
                  onChange={(e) => set("codeOfConductAccepted", e.target.checked)}
                />
                <Checkbox
                  label="I consent to CSEAG processing my personal data for membership purposes, in line with Ghana's Data Protection Act, 2012 (Act 843)."
                  checked={fields.privacyConsentAccepted}
                  onChange={(e) => set("privacyConsentAccepted", e.target.checked)}
                />
              </div>
            )}
          </CardBody>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={goBack} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext}>
              Continue <IconChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
