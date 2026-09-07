"use client";

import { useEffect, useState } from "react";

interface AppRow {
  applicationId: string;
  status: string;
  submittedAt: string;
  reviewerNotes: string | null;
  statementOfInterest: string | null;
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  membershipCategory: string;
  areasOfExpertise: string;
  yearsOfExperience: number | null;
}

export default function AdminPage() {
  const [rows, setRows] = useState<AppRow[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/applications");
    if (res.status === 403) {
      setError("You don't have permission to view this page.");
      return;
    }
    const data = await res.json();
    setRows(data.applications);
  }

  useEffect(() => {
    // Fetching on mount and updating state once the response arrives is the
    // standard "synchronize with an external system" use of an effect; the
    // setState calls happen after the awaited fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function decide(id: string, decision: "approved" | "rejected" | "more_info_requested") {
    setBusyId(id);
    await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, notes: notes[id] || "" }),
    });
    setBusyId(null);
    load();
  }

  if (error) return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-red-600">{error}</div>;
  if (!rows) return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">Loading...</div>;

  const pending = rows.filter((r) => r.status === "pending" || r.status === "more_info_requested");
  const decided = rows.filter((r) => r.status === "approved" || r.status === "rejected");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-navy)]">Membership Review Queue</h1>
      <p className="mt-1 text-sm text-slate-600">{pending.length} application(s) awaiting a decision.</p>

      <div className="mt-6 space-y-4">
        {pending.map((r) => (
          <div key={r.applicationId} className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--color-navy)]">{r.fullName}</p>
                <p className="text-sm text-slate-500">
                  {r.email} · {r.phone}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                {r.status === "pending" ? "Pending review" : "More info requested"}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-400">Category</dt>
                <dd>{r.membershipCategory}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Experience</dt>
                <dd>{r.yearsOfExperience ?? "—"} yrs</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-400">Expertise</dt>
                <dd>{JSON.parse(r.areasOfExpertise || "[]").join(", ")}</dd>
              </div>
            </dl>

            {r.statementOfInterest && (
              <p className="mt-3 text-sm italic text-slate-600">&ldquo;{r.statementOfInterest}&rdquo;</p>
            )}

            <textarea
              placeholder="Optional note to the applicant..."
              value={notes[r.applicationId] || ""}
              onChange={(e) => setNotes((n) => ({ ...n, [r.applicationId]: e.target.value }))}
              rows={2}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={busyId === r.applicationId}
                onClick={() => decide(r.applicationId, "approved")}
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Approve
              </button>
              <button
                disabled={busyId === r.applicationId}
                onClick={() => decide(r.applicationId, "more_info_requested")}
                className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
              >
                Request more info
              </button>
              <button
                disabled={busyId === r.applicationId}
                onClick={() => decide(r.applicationId, "rejected")}
                className="rounded-md border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-700 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-sm text-slate-500">No applications waiting for review.</p>}
      </div>

      {decided.length > 0 && (
        <div className="mt-10">
          <h2 className="font-semibold text-[var(--color-navy)]">Recent decisions</h2>
          <div className="mt-3 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {decided.map((r) => (
              <div key={r.applicationId} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{r.fullName}</span>
                <span className={r.status === "approved" ? "text-emerald-700" : "text-red-700"}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
