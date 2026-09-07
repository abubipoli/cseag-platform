"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AREAS_OF_EXPERTISE } from "@/lib/constants";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "associate", label: "Associate" },
  { value: "full_professional", label: "Full / Professional" },
  { value: "corporate", label: "Corporate" },
];

export default function ApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);

  function toggleExpertise(area: string) {
    setExpertise((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
      phone: form.get("phone"),
      region: form.get("region") || undefined,
      employer: form.get("employer") || undefined,
      currentRole: form.get("currentRole") || undefined,
      yearsOfExperience: form.get("yearsOfExperience") ? Number(form.get("yearsOfExperience")) : undefined,
      areasOfExpertise: expertise,
      membershipCategory: form.get("membershipCategory"),
      bio: form.get("bio") || undefined,
      statementOfInterest: form.get("statementOfInterest") || undefined,
      codeOfConductAccepted: form.get("codeOfConductAccepted") === "on",
      privacyConsentAccepted: form.get("privacyConsentAccepted") === "on",
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
      for (const [field, msgs] of Object.entries(data.error.fieldErrors as Record<string, string[]>)) {
        for (const m of msgs) messages.push(`${field}: ${m}`);
      }
    }
    if (typeof data?.error === "string") messages.push(data.error);
    setErrors(messages.length ? messages : ["Something went wrong. Please try again."]);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-navy)]">Become a CSEAG Member</h1>
      <p className="mt-2 text-sm text-slate-600">
        Fill out the form below to apply. You&rsquo;ll get an email and SMS confirmation right away, and our
        membership committee will review your application.
      </p>

      {errors.length > 0 && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <ul className="list-inside list-disc">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Field label="Full name" name="fullName" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email address" name="email" type="email" required />
          <Field label="Mobile number (for SMS)" name="phone" placeholder="+233241234567" required />
        </div>
        <Field label="Create a password" name="password" type="password" required minLength={8} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Region" name="region" />
          <div>
            <label className="block text-sm font-medium text-slate-700">Membership category</label>
            <select
              name="membershipCategory"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current employer" name="employer" />
          <Field label="Current role / title" name="currentRole" />
        </div>
        <Field label="Years of cybersecurity experience" name="yearsOfExperience" type="number" min={0} max={60} />

        <div>
          <label className="block text-sm font-medium text-slate-700">Areas of expertise</label>
          <div className="mt-2 grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-slate-200 p-3 sm:grid-cols-2">
            {AREAS_OF_EXPERTISE.map((area) => (
              <label key={area} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={expertise.includes(area)}
                  onChange={() => toggleExpertise(area)}
                  className="rounded border-slate-300"
                />
                {area}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Short professional bio</label>
          <textarea
            name="bio"
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Statement of interest (optional)</label>
          <textarea
            name="statementOfInterest"
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Why do you want to join CSEAG?"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="codeOfConductAccepted" className="mt-0.5 rounded border-slate-300" />
            I accept the CSEAG Code of Conduct.
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="privacyConsentAccepted" className="mt-0.5 rounded border-slate-300" />
            I consent to CSEAG processing my personal data for membership purposes, in line with Ghana&rsquo;s
            Data Protection Act, 2012 (Act 843).
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  minLength,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        min={min}
        max={max}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
