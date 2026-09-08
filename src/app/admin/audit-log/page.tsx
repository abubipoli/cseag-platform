"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { IconHistory, IconSearch } from "@/components/ui/icons";

interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: string;
  actorName: string | null;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit-log")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []));
  }, []);

  const actionOptions = useMemo(() => {
    if (!entries) return [];
    return Array.from(new Set(entries.map((e) => e.action))).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const query = q.trim().toLowerCase();
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1 : null; // inclusive end of day

    return entries.filter((e) => {
      if (action && e.action !== action) return false;
      const createdTime = new Date(e.createdAt).getTime();
      if (fromTime !== null && createdTime < fromTime) return false;
      if (toTime !== null && createdTime > toTime) return false;
      if (query) {
        const readableAction = e.action.replace(/\./g, " ").replace(/_/g, " ");
        const haystack = `${e.actorName || "system"} ${e.action} ${readableAction} ${e.targetType || ""} ${e.targetId || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [entries, q, action, from, to]);

  const hasFilters = q || action || from || to;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="Every admin action recorded for accountability and compliance." />

      <Card>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:min-w-[220px]">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by actor, action, or target"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          <Select value={action} onChange={(e) => setAction(e.target.value)} className="sm:w-56">
            <option value="">All actions</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {a.replace(/\./g, " ").replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setQ("");
                setAction("");
                setFrom("");
                setTo("");
              }}
              className="text-sm font-medium text-accent-700 hover:text-accent-800"
            >
              Clear filters
            </button>
          )}
        </div>

        {!entries ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<IconHistory className="h-5 w-5" />}
              title={hasFilters ? "No activity matches your filters" : "No activity recorded yet"}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Actor</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell">Target</th>
                  <th className="px-3 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 font-medium text-navy-900">{e.actorName || "System"}</td>
                    <td className="px-3 py-3 text-slate-600">{e.action.replace(/\./g, " ").replace(/_/g, " ")}</td>
                    <td className="hidden px-3 py-3 text-xs text-slate-400 sm:table-cell">
                      {e.targetType ? `${e.targetType}:${(e.targetId || "").slice(0, 8)}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
