"use client";

import { ReportView } from "@/components/admin/ReportView";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";

interface ApplicationRow {
  fullName: string;
  email: string;
  membershipCategory: string | null;
  status: string;
  submittedAt: string;
  decisionAt: string | null;
  reviewerNotes: string | null;
}

export default function ApplicationsReportPage() {
  return (
    <ReportView<ApplicationRow>
      title="Applications"
      description="Every application with status, submission date, and decision date."
      apiBase="/api/admin/reports/applications"
      columns={[
        { key: "fullName", header: "Full name" },
        { key: "email", header: "Email" },
        { key: "membershipCategory", header: "Category" },
        { key: "status", header: "Status", render: (r) => APPLICATION_STATUS_LABELS[r.status] || r.status },
        { key: "submittedAt", header: "Submitted", render: (r) => new Date(r.submittedAt).toLocaleDateString() },
        { key: "decisionAt", header: "Decided", render: (r) => (r.decisionAt ? new Date(r.decisionAt).toLocaleDateString() : "—") },
      ]}
    />
  );
}
