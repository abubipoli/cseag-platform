"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconSearch, IconUsers, IconPlus } from "@/components/ui/icons";
import { MEMBERSHIP_CATEGORY_LABELS, ROLE_LABELS } from "@/lib/constants";
import MemberDetailDrawer from "./MemberDetailDrawer";
import AddUserDrawer from "./AddUserDrawer";

export interface MemberRow {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  membershipCategory: string | null;
  region: string | null;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState("member");

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (role) params.set("role", role);
    const res = await fetch(`/api/admin/members?${params.toString()}`);
    const data = await res.json();
    setMembers(data.members || []);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, role]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => d?.session?.role && setCurrentRole(d.session.role));
  }, []);

  const totals = members
    ? {
        total: members.length,
        active: members.filter((m) => m.isActive).length,
        inactive: members.filter((m) => !m.isActive).length,
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Search, review, and manage CSEAG member accounts."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <IconPlus className="h-4 w-4" /> Add user
          </Button>
        }
      />

      {totals && (
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Showing" value={totals.total} />
          <MiniStat label="Active" value={totals.active} tone="accent" />
          <MiniStat label="Inactive" value={totals.inactive} tone="red" />
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name, email, or phone"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-44">
            <option value="">All roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {!members ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : members.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<IconUsers className="h-5 w-5" />} title="No members match" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell">Category</th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="hidden px-3 py-3 font-medium lg:table-cell">Last login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} onClick={() => setActiveId(m.id)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.fullName} photoUrl={m.photoUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-navy-900">{m.fullName}</p>
                          <p className="truncate text-xs text-slate-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-slate-600 sm:table-cell">
                      {m.membershipCategory ? MEMBERSHIP_CATEGORY_LABELS[m.membershipCategory] : "—"}
                    </td>
                    <td className="hidden px-3 py-3 text-slate-600 md:table-cell">{ROLE_LABELS[m.role] || m.role}</td>
                    <td className="px-3 py-3">
                      <Badge tone={m.isActive ? "accent" : "red"} dot>
                        {m.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-slate-400 lg:table-cell">
                      {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <MemberDetailDrawer memberId={activeId} onClose={() => setActiveId(null)} onChanged={load} />
      <AddUserDrawer open={addOpen} currentRole={currentRole} onClose={() => setAddOpen(false)} onCreated={load} />
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "accent" | "red" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === "accent" ? "text-accent-700" : tone === "red" ? "text-red-600" : "text-navy-900"}`}>
        {value}
      </p>
    </div>
  );
}
