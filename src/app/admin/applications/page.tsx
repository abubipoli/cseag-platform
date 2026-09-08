"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconClipboard, IconFileText } from "@/components/ui/icons";
import { APPLICATION_STATUS_LABELS, MEMBERSHIP_CATEGORY_LABELS } from "@/lib/constants";

interface AppRow {
  applicationId: string;
  status: string;
  submittedAt: string;
  reviewerNotes: string | null;
  statementOfInterest: string | null;
  supportingDocumentUrl?: string | null;
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  membershipCategory: string;
  areasOfExpertise: string;
  yearsOfExperience: number | null;
}

type FilterTab = "pending" | "approved" | "rejected" | "all";

export default function AdminApplicationsPage() {
  const [rows, setRows] = useState<AppRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [active, setActive] = useState<AppRow | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function decide(id: string, decision: "approved" | "rejected" | "more_info_requested") {
    setBusy(true);
    await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, notes }),
    });
    setBusy(false);
    setActive(null);
    setNotes("");
    load();
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!rows) return <p className="text-sm text-slate-400">Loading…</p>;

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "pending") return r.status === "pending" || r.status === "more_info_requested";
    return r.status === tab;
  });

  const counts = {
    pending: rows.filter((r) => r.status === "pending" || r.status === "more_info_requested").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    all: rows.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Applications" description="Review, approve, or reject membership applications." />

      <Tabs<FilterTab>
        active={tab}
        onChange={setTab}
        counts={counts}
        tabs={[
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "all", label: "All" },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<IconClipboard className="h-5 w-5" />} title="Nothing here" body="No applications match this filter." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <button key={r.applicationId} onClick={() => { setActive(r); setNotes(r.reviewerNotes || ""); }} className="text-left">
              <Card className="transition-shadow hover:shadow-md">
                <CardBody className="flex flex-wrap items-center gap-4">
                  <Avatar name={r.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-900">{r.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{r.email} · {r.phone}</p>
                  </div>
                  <Badge>{MEMBERSHIP_CATEGORY_LABELS[r.membershipCategory] || r.membershipCategory}</Badge>
                  <Badge tone={statusTone(r.status)}>{APPLICATION_STATUS_LABELS[r.status] || r.status}</Badge>
                  <span className="hidden text-xs text-slate-400 sm:block">
                    {new Date(r.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.fullName || ""} wide>
        {active && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={active.fullName} size="lg" />
              <div>
                <p className="font-semibold text-navy-900">{active.fullName}</p>
                <p className="text-sm text-slate-500">{active.email} · {active.phone}</p>
              </div>
              <Badge tone={statusTone(active.status)} className="ml-auto">
                {APPLICATION_STATUS_LABELS[active.status]}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Category</dt>
                <dd className="font-medium text-navy-900">{MEMBERSHIP_CATEGORY_LABELS[active.membershipCategory] || active.membershipCategory}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Experience</dt>
                <dd className="font-medium text-navy-900">{active.yearsOfExperience ?? "—"} yrs</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-400">Areas of expertise</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {JSON.parse(active.areasOfExpertise || "[]").map((a: string) => (
                    <Badge key={a} tone="accent">
                      {a}
                    </Badge>
                  ))}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-400">Submitted</dt>
                <dd className="font-medium text-navy-900">{new Date(active.submittedAt).toLocaleString()}</dd>
              </div>
            </dl>

            {active.statementOfInterest && (
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Statement of interest</p>
                <p className="mt-1 text-sm italic text-slate-600">&ldquo;{active.statementOfInterest}&rdquo;</p>
              </div>
            )}

            {active.supportingDocumentUrl && (
              <a
                href={active.supportingDocumentUrl}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-700 hover:text-accent-800"
              >
                <IconFileText className="h-4 w-4" /> View supporting document
              </a>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Note to applicant (optional)</label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {active && (active.status === "pending" || active.status === "more_info_requested") && (
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => decide(active.applicationId, "approved")}>
              Approve
            </Button>
            <Button disabled={busy} variant="outline" onClick={() => decide(active.applicationId, "more_info_requested")}>
              Request more info
            </Button>
            <Button disabled={busy} variant="danger" onClick={() => decide(active.applicationId, "rejected")}>
              Reject
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
