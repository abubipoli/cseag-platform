"use client";

import { ReportView } from "@/components/admin/ReportView";
import { Badge, statusTone } from "@/components/ui/Badge";
import { SERVICE_REQUEST_STATUSES } from "@/db/schema";

interface ServiceRequestRow {
  expertName: string;
  assignedExpertName: string | null;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  message: string;
  status: string;
  createdAt: string;
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function ServiceRequestSummary(rows: ServiceRequestRow[]) {
  const counts = SERVICE_REQUEST_STATUSES.map((status) => ({
    status,
    count: rows.filter((r) => r.status === status).length,
  }));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 print:grid-cols-6">
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center print:border print:shadow-none">
        <p className="text-xs text-slate-400">Total</p>
        <p className="mt-1 font-semibold text-navy-900">{rows.length}</p>
      </div>
      {counts.map((c) => (
        <div key={c.status} className="rounded-xl border border-slate-200 bg-white p-3 text-center print:border print:shadow-none">
          <p className="text-xs text-slate-400">{statusLabel(c.status)}</p>
          <p className="mt-1 font-semibold text-navy-900">{c.count}</p>
        </div>
      ))}
    </div>
  );
}

export default function ServiceRequestsReportPage() {
  return (
    <ReportView<ServiceRequestRow>
      title="Service requests"
      description="Every request for expert help, who it went to, and its current status."
      apiBase="/api/admin/reports/service-requests"
      summary={ServiceRequestSummary}
      columns={[
        { key: "expertName", header: "Requested expert" },
        { key: "assignedExpertName", header: "Assigned to", render: (r) => r.assignedExpertName || "—" },
        { key: "requesterName", header: "Requester" },
        { key: "requesterEmail", header: "Email" },
        { key: "requesterPhone", header: "Phone", render: (r) => r.requesterPhone || "—" },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge tone={statusTone(r.status === "resolved" ? "active" : r.status === "declined" ? "inactive" : "pending")}>{statusLabel(r.status)}</Badge>,
        },
        { key: "createdAt", header: "Submitted", render: (r) => new Date(r.createdAt).toLocaleDateString() },
      ]}
    />
  );
}
