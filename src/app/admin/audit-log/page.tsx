"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconHistory } from "@/components/ui/icons";

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

  useEffect(() => {
    fetch("/api/admin/audit-log")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="Every admin action recorded for accountability and compliance." />

      <Card>
        {!entries ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<IconHistory className="h-5 w-5" />} title="No activity recorded yet" />
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
                {entries.map((e) => (
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
