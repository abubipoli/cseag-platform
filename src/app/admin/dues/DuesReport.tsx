"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FieldWrap, Input, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { MEMBERSHIP_CATEGORY_LABELS } from "@/lib/constants";
import { IconBarChart } from "@/components/ui/icons";

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

const STATUS_LABELS: Record<Row["status"], string> = { paid: "Paid", partial: "Partially paid", unpaid: "Not paid" };

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
                {rows.map((r) => (
                  <tr key={r.userId}>
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
                      <Button variant="outline" size="sm" onClick={() => setRecordFor(r)}>
                        Record payment
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
