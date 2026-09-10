import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { IconUsers, IconClipboard, IconCheckCircle, IconMessageSquare, IconDownload, IconFileSpreadsheet } from "@/components/ui/icons";

const REPORTS = [
  {
    href: "/admin/reports/members",
    api: "/api/admin/reports/members",
    icon: IconUsers,
    title: "Member list",
    body: "Full name, contact, category, region, and role for every member and applicant.",
  },
  {
    href: "/admin/reports/applications",
    api: "/api/admin/reports/applications",
    icon: IconClipboard,
    title: "Applications",
    body: "Every application with status, submission date, and decision date.",
  },
  {
    href: "/admin/reports/dues",
    api: "/api/admin/reports/dues",
    icon: IconCheckCircle,
    title: "Membership dues",
    body: "Per-member dues status for the current year, plus collected/outstanding totals.",
  },
  {
    href: "/admin/reports/service-requests",
    api: "/api/admin/reports/service-requests",
    icon: IconMessageSquare,
    title: "Service requests",
    body: "Every request for expert help, who it's assigned to, and status breakdown.",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="View, print, or export membership, application, dues, and service-request data."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.href}>
            <CardBody className="flex flex-col items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-navy-900">
                <r.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-navy-900">{r.title}</p>
                <p className="mt-1 text-sm text-slate-500">{r.body}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={r.href} variant="primary" size="sm">
                  View / Print
                </ButtonLink>
                <a
                  href={`${r.api}?format=csv`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-accent-500 hover:text-accent-700"
                >
                  <IconDownload className="h-4 w-4" /> CSV
                </a>
                <a
                  href={`${r.api}?format=xlsx`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-accent-500 hover:text-accent-700"
                >
                  <IconFileSpreadsheet className="h-4 w-4" /> Excel
                </a>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
