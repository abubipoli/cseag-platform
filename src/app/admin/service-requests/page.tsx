"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Textarea, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ServiceRequestChat } from "@/components/ServiceRequestChat";
import { IconMessageSquare, IconMail, IconPhone } from "@/components/ui/icons";

interface Ticket {
  id: string;
  expertUserId: string;
  expertName: string;
  assignedExpertUserId: string | null;
  assignedExpertName: string | null;
  assignedAt: string | null;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  message: string;
  status: "new" | "contacted" | "in_progress" | "resolved" | "declined";
  adminNotes: string | null;
  expertNotifiedAt: string | null;
  createdAt: string;
}

interface ExpertOption {
  id: string;
  fullName: string;
  isActive: boolean;
}

const STATUS_LABELS: Record<Ticket["status"], string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In Progress",
  resolved: "Resolved",
  declined: "Declined",
};

type FilterTab = "open" | "resolved" | "all";

export default function ServiceRequestsPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [experts, setExperts] = useState<ExpertOption[]>([]);
  const [tab, setTab] = useState<FilterTab>("open");
  const [active, setActive] = useState<Ticket | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/service-requests");
    const data = await res.json();
    setTickets(data.requests || []);
  }

  async function loadExperts() {
    const res = await fetch("/api/admin/members?role=member&status=active");
    const data = await res.json();
    setExperts((data.members || []).map((m: { id: string; fullName: string; isActive: boolean }) => m));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    loadExperts();
  }, []);

  function openTicket(t: Ticket) {
    setActive(t);
    setNotes(t.adminNotes || "");
    setAssignTo(t.assignedExpertUserId || t.expertUserId);
    setNotice(null);
  }

  async function updateTicket(body: Record<string, unknown>) {
    if (!active) return;
    setBusy(true);
    const res = await fetch(`/api/admin/service-requests/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      const res2 = await fetch("/api/admin/service-requests");
      const data2 = await res2.json();
      const rows: Ticket[] = data2.requests || [];
      setTickets(rows);
      const refreshed = rows.find((r) => r.id === active.id);
      if (refreshed) {
        setActive(refreshed);
        setNotes(refreshed.adminNotes || "");
      }
    } else {
      const data = await res.json().catch(() => ({}));
      setNotice(typeof data.error === "string" ? data.error : "That action didn't go through.");
    }
  }

  if (!tickets) return <p className="text-sm text-slate-400">Loading…</p>;

  const filtered = tickets.filter((t) => {
    if (tab === "all") return true;
    if (tab === "resolved") return t.status === "resolved" || t.status === "declined";
    return t.status !== "resolved" && t.status !== "declined";
  });

  const counts = {
    open: tickets.filter((t) => t.status !== "resolved" && t.status !== "declined").length,
    resolved: tickets.filter((t) => t.status === "resolved" || t.status === "declined").length,
    all: tickets.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Requests"
        description="Visitors requesting an expert's services land here first — assign an expert, and monitor the conversation through to close."
      />

      <Tabs<FilterTab>
        active={tab}
        onChange={setTab}
        counts={counts}
        tabs={[
          { value: "open", label: "Open" },
          { value: "resolved", label: "Closed" },
          { value: "all", label: "All" },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<IconMessageSquare className="h-5 w-5" />} title="Nothing here" body="No service requests match this filter." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => openTicket(t)} className="text-left">
              <Card className="transition-shadow hover:shadow-md">
                <CardBody className="flex flex-wrap items-center gap-4">
                  <Avatar name={t.requesterName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-900">{t.requesterName}</p>
                    <p className="truncate text-xs text-slate-500">
                      wants <span className="font-medium text-slate-700">{t.expertName}</span> — {t.message}
                    </p>
                  </div>
                  {t.assignedExpertName && (
                    <Badge tone="sky">Assigned: {t.assignedExpertName}</Badge>
                  )}
                  <Badge tone={statusTone(t.status)}>{STATUS_LABELS[t.status]}</Badge>
                  <span className="hidden text-xs text-slate-400 sm:block">
                    {new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} title="Service Request" wide>
        {active && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={active.requesterName} size="lg" />
              <div>
                <p className="font-semibold text-navy-900">{active.requesterName}</p>
                <p className="text-sm text-slate-500">
                  requesting <span className="font-medium text-slate-700">{active.expertName}</span>
                </p>
              </div>
              <Badge tone={statusTone(active.status)} className="ml-auto">
                {STATUS_LABELS[active.status]}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <a href={`mailto:${active.requesterEmail}`} className="flex items-center gap-1.5 text-slate-600 hover:text-accent-700">
                <IconMail className="h-4 w-4" /> {active.requesterEmail}
              </a>
              {active.requesterPhone && (
                <a href={`tel:${active.requesterPhone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-accent-700">
                  <IconPhone className="h-4 w-4" /> {active.requesterPhone}
                </a>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">What they need</p>
              <p className="mt-1 text-sm italic text-slate-600">&ldquo;{active.message}&rdquo;</p>
            </div>

            {notice && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}

            <div className="rounded-xl border border-slate-200 p-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Assign to expert</label>
              <div className="flex gap-2">
                <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} disabled={busy} className="flex-1">
                  <option value="">Select an expert…</option>
                  {experts.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName}
                      {e.id === active.expertUserId ? " (originally requested)" : ""}
                    </option>
                  ))}
                </Select>
                <Button
                  disabled={busy || !assignTo}
                  onClick={() => updateTicket({ assignExpertUserId: assignTo })}
                >
                  {active.assignedExpertUserId ? "Reassign" : "Assign"}
                </Button>
              </div>
              {active.assignedExpertName ? (
                <p className="mt-2 text-xs text-accent-700">
                  Currently assigned to <strong>{active.assignedExpertName}</strong>
                  {active.assignedAt && ` on ${new Date(active.assignedAt).toLocaleString()}`}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Not yet assigned — the expert and requester are only notified once you assign.</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
              <Select value={active.status} onChange={(e) => updateTicket({ status: e.target.value })} disabled={busy}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Internal notes</label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button variant="outline" size="sm" disabled={busy} onClick={() => updateTicket({ adminNotes: notes })} className="mt-2">
                Save Notes
              </Button>
            </div>

            {active.assignedExpertUserId && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Conversation (monitored)</p>
                <ServiceRequestChat serviceRequestId={active.id} />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
