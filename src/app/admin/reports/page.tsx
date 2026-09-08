"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { IconUsers, IconClipboard, IconDownload } from "@/components/ui/icons";

// Plain <a> tags, deliberately not next/link's <Link>: these URLs return a
// file download (Content-Disposition: attachment), and Link's client-side
// routing would try to treat them as an in-app page transition instead.
function DownloadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-accent-500 hover:text-accent-700"
    >
      {children}
    </a>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Export membership and application data to CSV/Excel." />

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardBody className="flex flex-col items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-navy-900">
              <IconUsers className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-navy-900">Member list</p>
              <p className="mt-1 text-sm text-slate-500">
                Full name, contact, category, region, and role for every member and applicant.
              </p>
            </div>
            <DownloadLink href="/api/admin/reports/members">
              <IconDownload className="h-4 w-4" /> Download CSV
            </DownloadLink>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-navy-900">
              <IconClipboard className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-navy-900">Applications</p>
              <p className="mt-1 text-sm text-slate-500">Every application with status, submission date, and decision date.</p>
            </div>
            <DownloadLink href="/api/admin/reports/applications">
              <IconDownload className="h-4 w-4" /> Download CSV
            </DownloadLink>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
