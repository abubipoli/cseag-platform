"use client";

import { ReportView } from "@/components/admin/ReportView";
import { Badge } from "@/components/ui/Badge";

interface DuesRow {
  fullName: string;
  email: string;
  membershipCategory: string | null;
  year: string;
  duesAmountGhs: number;
  totalPaidGhs: number;
  balanceGhs: number;
  status: "paid" | "partial" | "unpaid";
}

function DuesSummary(rows: DuesRow[]) {
  const totalCollected = rows.reduce((sum, r) => sum + r.totalPaidGhs, 0);
  const totalOutstanding = rows.reduce((sum, r) => sum + r.balanceGhs, 0);
  const paid = rows.filter((r) => r.status === "paid").length;
  const partial = rows.filter((r) => r.status === "partial").length;
  const unpaid = rows.filter((r) => r.status === "unpaid").length;

  const stats = [
    { label: "Collected", value: `GHS ${totalCollected.toLocaleString()}` },
    { label: "Outstanding", value: `GHS ${totalOutstanding.toLocaleString()}` },
    { label: "Paid up", value: paid },
    { label: "Partial", value: partial },
    { label: "Unpaid", value: unpaid },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 print:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center print:border print:shadow-none">
          <p className="text-xs text-slate-400">{s.label}</p>
          <p className="mt-1 font-semibold text-navy-900">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function DuesReportPage() {
  return (
    <ReportView<DuesRow>
      title="Membership dues"
      description="Every member's dues status for the current year, with collected/outstanding totals."
      apiBase="/api/admin/reports/dues"
      summary={DuesSummary}
      columns={[
        { key: "fullName", header: "Full name" },
        { key: "email", header: "Email" },
        { key: "membershipCategory", header: "Category" },
        { key: "duesAmountGhs", header: "Dues", align: "right", render: (r) => `GHS ${r.duesAmountGhs.toLocaleString()}` },
        { key: "totalPaidGhs", header: "Paid", align: "right", render: (r) => `GHS ${r.totalPaidGhs.toLocaleString()}` },
        { key: "balanceGhs", header: "Balance", align: "right", render: (r) => `GHS ${r.balanceGhs.toLocaleString()}` },
        {
          key: "status",
          header: "Status",
          render: (r) => (
            <Badge tone={r.status === "paid" ? "accent" : r.status === "partial" ? "amber" : "red"}>{r.status}</Badge>
          ),
        },
      ]}
    />
  );
}
