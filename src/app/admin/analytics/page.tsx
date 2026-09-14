"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconActivity, IconUsers, IconGlobe, IconFileText } from "@/components/ui/icons";

interface DayCount {
  day: string;
  count: number;
}
interface PathCount {
  path: string;
  count: number;
}
interface CountryCount {
  country: string | null;
  count: number;
}
interface ReferrerCount {
  referrer: string | null;
  count: number;
}
interface RecentVisit {
  id: string;
  path: string;
  country: string | null;
  city: string | null;
  userAgent: string | null;
  createdAt: string;
  userId: string | null;
  visitorName: string | null;
}

interface AnalyticsData {
  totalVisits: number;
  todayVisits: number;
  uniqueVisitors: number;
  byDay: DayCount[];
  topPages: PathCount[];
  topCountries: CountryCount[];
  topReferrers: ReferrerCount[];
  recent: RecentVisit[];
}

function summarizeUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  return `${browser} · ${isMobile ? "Mobile" : "Desktop"}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Site visitor traffic — counts, locations, and recent activity." />
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  const maxDay = Math.max(1, ...data.byDay.map((d) => d.count));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Site visitor traffic — counts, locations, and recent activity." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<IconActivity className="h-5 w-5" />} label="Total visits" value={data.totalVisits} tone="accent" />
        <StatCard icon={<IconUsers className="h-5 w-5" />} label="Unique visitors" value={data.uniqueVisitors} tone="sky" />
        <StatCard icon={<IconActivity className="h-5 w-5" />} label="Visits today" value={data.todayVisits} tone="amber" />
      </div>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-navy-900">Last 14 days</h3>
          {data.byDay.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No visits recorded yet.</p>
          ) : (
            <div className="mt-4 flex items-end gap-2" style={{ height: 140 }}>
              {[...data.byDay].reverse().map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md bg-accent-500/80"
                    style={{ height: `${Math.max(4, (d.count / maxDay) * 110)}px` }}
                    title={`${d.day}: ${d.count} visits`}
                  />
                  <span className="text-[10px] text-slate-400">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="flex items-center gap-2 font-semibold text-navy-900">
              <IconFileText className="h-4 w-4 text-accent-600" /> Top pages
            </h3>
            {data.topPages.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No data yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {data.topPages.map((p) => (
                  <li key={p.path} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-600">{p.path}</span>
                    <span className="shrink-0 font-medium text-navy-900">{p.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="flex items-center gap-2 font-semibold text-navy-900">
              <IconGlobe className="h-4 w-4 text-accent-600" /> Top countries
            </h3>
            {data.topCountries.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No location data resolved yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {data.topCountries.map((c) => (
                  <li key={c.country} className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">{c.country}</span>
                    <span className="font-medium text-navy-900">{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {data.topReferrers.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="font-semibold text-navy-900">Top referrers</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.topReferrers.map((r) => (
                <li key={r.referrer} className="flex items-center justify-between gap-2">
                  <span className="truncate text-slate-600">{r.referrer}</span>
                  <span className="shrink-0 font-medium text-navy-900">{r.count}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <h3 className="font-semibold text-navy-900">Recent visits</h3>
          {data.recent.length === 0 ? (
            <div className="mt-3">
              <EmptyState icon={<IconActivity className="h-5 w-5" />} title="No visits recorded yet" />
            </div>
          ) : (
            <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-y border-slate-100 bg-white text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2.5 pr-3 font-medium">Who</th>
                    <th className="py-2.5 pr-3 font-medium">Page</th>
                    <th className="py-2.5 pr-3 font-medium">Location</th>
                    <th className="py-2.5 pr-3 font-medium">Device</th>
                    <th className="py-2.5 pl-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2.5 pr-3 text-navy-900">{v.visitorName || (v.userId ? "Member" : "Anonymous")}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{v.path}</td>
                      <td className="py-2.5 pr-3 text-slate-500">
                        {v.city ? `${v.city}, ` : ""}
                        {v.country || "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-500">{summarizeUserAgent(v.userAgent)}</td>
                      <td className="py-2.5 pl-3 text-xs text-slate-400">
                        {new Date(v.createdAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
