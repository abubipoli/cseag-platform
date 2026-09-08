"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconUsers,
  IconUserCheck,
  IconClipboard,
  IconXCircle,
  IconMail,
  IconMessageSquare,
  IconHistory,
} from "@/components/ui/icons";

interface Stats {
  totalMembers: number;
  activeMembers: number;
  pendingApplications: number;
  approvedThisMonth: number;
  rejectedApplications: number;
  newsletterSubscribers: number;
  openServiceRequests: number;
  recentActivity: { id: string; action: string; actorName: string | null; createdAt: string; targetType: string | null }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="An overview of CSEAG membership activity." />

      {!stats ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard tone="navy" icon={<IconUsers className="h-5 w-5" />} label="Total Members" value={stats.totalMembers} />
            <StatCard tone="accent" icon={<IconUserCheck className="h-5 w-5" />} label="Active Members" value={stats.activeMembers} />
            <StatCard tone="amber" icon={<IconClipboard className="h-5 w-5" />} label="Pending Applications" value={stats.pendingApplications} hint="Awaiting a decision" />
            <StatCard tone="sky" icon={<IconUserCheck className="h-5 w-5" />} label="Approved This Month" value={stats.approvedThisMonth} />
            <StatCard tone="red" icon={<IconXCircle className="h-5 w-5" />} label="Rejected Applications" value={stats.rejectedApplications} />
            <StatCard tone="amber" icon={<IconMessageSquare className="h-5 w-5" />} label="Open Service Requests" value={stats.openServiceRequests} hint="Awaiting expert follow-up" />
            <StatCard tone="navy" icon={<IconMail className="h-5 w-5" />} label="Newsletter Subscribers" value={stats.newsletterSubscribers} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex items-center justify-between">
                <p className="font-semibold text-navy-900">Recent activity</p>
                <Link href="/admin/audit-log" className="text-xs font-medium text-accent-700 hover:text-accent-800">
                  View audit log
                </Link>
              </CardHeader>
              <CardBody>
                {stats.recentActivity.length === 0 ? (
                  <EmptyState icon={<IconHistory className="h-5 w-5" />} title="No activity yet" />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {stats.recentActivity.map((a) => (
                      <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <span className="font-medium text-navy-900">{a.actorName || "System"}</span>{" "}
                          <span className="text-slate-500">{formatAction(a.action)}</span>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <p className="font-semibold text-navy-900">Quick actions</p>
              </CardHeader>
              <CardBody className="flex flex-col gap-2.5">
                <ButtonLink href="/admin/applications" variant="outline" className="justify-start">
                  Review applications
                </ButtonLink>
                <ButtonLink href="/admin/service-requests" variant="outline" className="justify-start">
                  Review service requests
                </ButtonLink>
                <ButtonLink href="/admin/members" variant="outline" className="justify-start">
                  Manage members
                </ButtonLink>
                <ButtonLink href="/admin/content" variant="outline" className="justify-start">
                  Publish content
                </ButtonLink>
                <ButtonLink href="/admin/communications" variant="outline" className="justify-start">
                  Send a message
                </ButtonLink>
                <ButtonLink href="/admin/reports" variant="outline" className="justify-start">
                  Export reports
                </ButtonLink>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function formatAction(action: string) {
  return action.replace(/\./g, " ").replace(/_/g, " ");
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
