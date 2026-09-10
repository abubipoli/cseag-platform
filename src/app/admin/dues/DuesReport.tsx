"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldWrap, Input, Textarea, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { MEMBERSHIP_CATEGORY_LABELS } from "@/lib/constants";
import { IconBarChart, IconSearch } from "@/components/ui/icons";

interface Row {
  userId: string;
  name: string;
  email: string;
  membershipCategory: string | null;
  duesAmountGhs: number;
  totalPaidGhs: number;
  balanceGhs: number;
  status: "paid" | "partial" | "unpaid";
}

interface Summary {
  year: string;
  duesAmountGhs: number;
  totalCollectedGhs: number;
  totalOutstandingGhs: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

interface PaymentHistoryItem {
  id: string;
  amountGhs: number;
  method: "paystack" | "manual";
  status: "pending" | "success" | "failed";
  note: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<Row["status"], string> = { paid: "Paid", partial: "Partially paid", unpaid: "Not paid" };
const PAYMENT_STATUS_LABELS: Record<PaymentHistoryItem["status"], string> = {
  success: "Success",
  pending: "Pending",
  failed: "Failed",
};

function ghs(n: number) {
  return `GHS ${n.toLocaleString()}`;
}

export default function DuesReport() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recordFor, setRecordFor] = useState<Row | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Row["status"]>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [historyFor, setHistoryFor] = useState<Row | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[] | null>(null);

  useEffect(() => {
    if (!historyFor) {
      setHistory(null);
      return;
    }
    fetch(`/api/admin/members/${historyFor.userId}/dues`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { payments: PaymentHistoryItem[] } | null) => setHistory(d?.payments || []));
  }, [historyFor]);

  function load() {
    fetch("/api/admin/dues")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { rows: Row[]; summary: Summary } | null) => {
        if (!d) return;
        setRows(d.rows);
        setSummary(d.summary);
      });
  }

  useEffect(load, []);

  async function handleRecord() {
    if (!recordFor || !amount) return;
    setSaving(true);
    const res = await fetch("/api/admin/dues/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: recordFor.userId, amountGhs: Number(amount), note: note || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setRecordFor(null);
      setAmount("");
      setNote("");
      load();
    }
  }

  const categories = Array.from(new Set((rows || []).map((r) => r.membershipCategory).filter((c): c is string => !!c)));

  const filteredRows = (rows || []).filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (categoryFilter && r.membershipCategory !== categoryFilter) return false;
    if (query && !`${r.name} ${r.email}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const statusCounts = {
    all: rows?.length ?? 0,
    paid: rows?.filter((r) => r.status === "paid").length ?? 0,
    partial: rows?.filter((r) => r.status === "partial").length ?? 0,
    unpaid: rows?.filter((r) => r.status === "unpaid").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Membership dues" description="Who's paid, who's partial, and who's still outstanding — not enforced, just tracked." />

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Collected" value={ghs(summary.totalCollectedGhs)} />
          <StatTile label="Outstanding" value={ghs(summary.totalOutstandingGhs)} />
          <StatTile label="Paid in full" value={`${summary.paidCount}`} tone="accent" />
          <StatTile label="Unpaid" value={`${summary.unpaidCount}`} tone="red" />
        </div>
      )}

      <Card>
        {!rows ? (
          <CardBody>
            <p className="text-sm text-slate-400">Loading…</p>
          </CardBody>
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState icon={<IconBarChart className="h-5 w-5" />} title="No members yet" />
          </CardBody>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["all", "All"],
                    ["paid", "Paid"],
                    ["partial", "Partial"],
                    ["unpaid", "Unpaid"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors " +
                      (statusFilter === value ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                    }
                  >
                    {label} ({statusCounts[value]})
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search by name or email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 sm:w-56"
                  />
                </div>
                {categories.length > 0 && (
                  <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-48">
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {MEMBERSHIP_CATEGORY_LABELS[c] || c}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <CardBody>
                <EmptyState icon={<IconBarChart className="h-5 w-5" />} title="No members match those filters" />
              </CardBody>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 sm:px-6">Member</th>
                      <th className="px-5 py-3 sm:px-6">Category</th>
                      <th className="px-5 py-3 sm:px-6">Paid</th>
                      <th className="px-5 py-3 sm:px-6">Balance</th>
                      <th className="px-5 py-3 sm:px-6">Status</th>
                      <th className="px-5 py-3 sm:px-6" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((r) => (
                  <tr
                    key={r.userId}
                    onClick={() => setHistoryFor(r)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 sm:px-6">
                      <p className="font-medium text-navy-900">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 sm:px-6">
                      {r.membershipCategory ? MEMBERSHIP_CATEGORY_LABELS[r.membershipCategory] || r.membershipCategory : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 sm:px-6">{ghs(r.totalPaidGhs)}</td>
                    <td className="px-5 py-3 text-slate-600 sm:px-6">{ghs(r.balanceGhs)}</td>
                    <td className="px-5 py-3 sm:px-6">
                      <Badge tone={statusTone(r.status === "paid" ? "active" : r.status === "unpaid" ? "inactive" : "pending")}>
                        {STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right sm:px-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecordFor(r);
                        }}
                      >
                        Record payment
                      </Button>
                    </td>
                  </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>

      <Drawer open={!!recordFor} onClose={() => setRecordFor(null)} title={`Record payment — ${recordFor?.name || ""}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            For a cash or offline payment (e.g. paid directly to the treasurer). Online Paystack payments record
            themselves automatically.
          </p>
          <FieldWrap label="Amount (GHS)" required>
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FieldWrap>
          <FieldWrap label="Note (optional)">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid in cash at the Sept meeting" />
          </FieldWrap>
          <Button onClick={handleRecord} disabled={saving || !amount}>
            {saving ? "Saving..." : "Record payment"}
          </Button>
        </div>
      </Drawer>

      <Drawer open={!!historyFor} onClose={() => setHistoryFor(null)} title={`Payment history — ${historyFor?.name || ""}`}>
        <div className="space-y-4">
          {historyFor && (
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-center text-sm">
              <div>
                <p className="text-xs text-slate-400">Dues</p>
                <p className="mt-0.5 font-semibold text-navy-900">{ghs(historyFor.duesAmountGhs)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Paid</p>
                <p className="mt-0.5 font-semibold text-navy-900">{ghs(historyFor.totalPaidGhs)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Balance</p>
                <p className="mt-0.5 font-semibold text-navy-900">{ghs(historyFor.balanceGhs)}</p>
              </div>
            </div>
          )}

          {!history ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : history.length === 0 ? (
            <EmptyState icon={<IconBarChart className="h-5 w-5" />} title="No payments recorded yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-navy-900">{ghs(p.amountGhs)}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                      {p.method === "paystack" ? "Paystack" : "Manual"}
                    </p>
                    {p.note && <p className="mt-1 text-xs text-slate-500">{p.note}</p>}
                  </div>
                  <Badge tone={statusTone(p.status === "success" ? "active" : p.status === "failed" ? "inactive" : "pending")}>
                    {PAYMENT_STATUS_LABELS[p.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          {historyFor && (
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                setRecordFor(historyFor);
                setHistoryFor(null);
              }}
            >
              Record a payment
            </Button>
          )}
        </div>
      </Drawer>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "accent" | "red" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone === "accent" ? "text-accent-700" : tone === "red" ? "text-red-600" : "text-navy-900"}`}>
        {value}
      </p>
    </div>
  );
}
