"use client";

import { ReportView } from "@/components/admin/ReportView";

interface MemberRow {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  membershipCategory: string | null;
  region: string | null;
  employer: string | null;
  yearsOfExperience: number | null;
  createdAt: string;
}

export default function MembersReportPage() {
  return (
    <ReportView<MemberRow>
      title="Member list"
      description="Full name, contact, category, region, and role for every member and applicant."
      apiBase="/api/admin/reports/members"
      columns={[
        { key: "fullName", header: "Full name" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "role", header: "Role" },
        { key: "status", header: "Status" },
        { key: "membershipCategory", header: "Category" },
        { key: "region", header: "Region" },
        { key: "employer", header: "Employer" },
        { key: "createdAt", header: "Joined", render: (r) => new Date(r.createdAt).toLocaleDateString() },
      ]}
    />
  );
}
