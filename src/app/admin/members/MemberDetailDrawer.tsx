"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Field";
import { MEMBERSHIP_CATEGORY_LABELS, ROLE_LABELS, APPLICATION_STATUS_LABELS, CSA_ACCREDITATION_TIER_LABELS } from "@/lib/constants";

interface DuesPaymentItem {
  id: string;
  amountGhs: number;
  method: "paystack" | "manual";
  status: "pending" | "success" | "failed";
  note: string | null;
  createdAt: string;
}

interface DuesSummary {
  year: string;
  duesAmountGhs: number;
  totalPaidGhs: number;
  balanceGhs: number;
  status: "paid" | "partial" | "unpaid";
  payments: DuesPaymentItem[];
}

const DUES_STATUS_LABELS: Record<DuesSummary["status"], string> = { paid: "Paid up", partial: "Partially paid", unpaid: "Not paid" };

interface Detail {
  user: { id: string; email: string; role: string; isActive: boolean; lastLoginAt: string | null; mfaEnabled: boolean };
  profile: {
    title: string | null;
    fullName: string;
    phone: string;
    photoUrl: string | null;
    ageGroup: string | null;
    employer: string | null;
    currentRole: string | null;
    yearsOfExperience: number | null;
    highestCertificate: string | null;
    csaAccredited: boolean;
    csaAccreditationTier: string | null;
    region: string | null;
    bio: string | null;
    membershipCategory: string | null;
    isListedInDirectory: boolean;
  };
  applications: { id: string; status: string; submittedAt: string; decisionAt: string | null }[];
}

export default function MemberDetailDrawer({
  memberId,
  currentRole,
  onClose,
  onChanged,
}: {
  memberId: string | null;
  currentRole?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [dues, setDues] = useState<DuesSummary | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- resetting local view
       state when the selected member changes, not synchronizing with an
       external system. */
    if (!memberId) {
      setDetail(null);
      setDues(null);
      return;
    }
    setMessage(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch(`/api/admin/members/${memberId}`)
      .then((r) => r.json())
      .then((d) => {
        setDetail(d);
        setEmailDraft(d?.user?.email || "");
      });

    if (currentRole === "super_admin") {
      fetch(`/api/admin/members/${memberId}/dues`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setDues);
    }
  }, [memberId, currentRole]);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    if (!memberId) return;
    setBusy(true);
    const res = await fetch(`/api/admin/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setMessage(successMessage);
      onChanged();
      fetch(`/api/admin/members/${memberId}`)
        .then((r) => r.json())
        .then((d) => {
          setDetail(d);
          setEmailDraft(d?.user?.email || "");
        });
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(typeof data.error === "string" ? data.error : "That action isn't permitted.");
    }
  }

  async function handleResetMfa() {
    if (!memberId) return;
    if (!confirm("Turn off 2FA for this member? Only do this if they've lost their device and their backup codes.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/members/${memberId}/reset-mfa`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      setMessage("2FA has been turned off for this member.");
      fetch(`/api/admin/members/${memberId}`)
        .then((r) => r.json())
        .then(setDetail);
    } else {
      setMessage("Couldn't reset 2FA.");
    }
  }

  return (
    <Drawer open={!!memberId} onClose={onClose} title={detail?.profile.fullName || "Member"} wide>
      {!detail ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Avatar name={detail.profile.fullName} photoUrl={detail.profile.photoUrl} size="lg" />
            <div>
              <p className="font-semibold text-navy-900">
                {detail.profile.title ? `${detail.profile.title} ` : ""}
                {detail.profile.fullName}
              </p>
              <p className="text-sm text-slate-500">{detail.user.email} · {detail.profile.phone}</p>
            </div>
            <Badge tone={detail.user.isActive ? "accent" : "red"} className="ml-auto">
              {detail.user.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {message && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p>}

          <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Employer / role</dt>
              <dd className="font-medium text-navy-900">
                {[detail.profile.currentRole, detail.profile.employer].filter(Boolean).join(" at ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Experience</dt>
              <dd className="font-medium text-navy-900">{detail.profile.yearsOfExperience ?? "—"} yrs</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Region</dt>
              <dd className="font-medium text-navy-900">{detail.profile.region || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Age group</dt>
              <dd className="font-medium text-navy-900">{detail.profile.ageGroup || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Highest certificate</dt>
              <dd className="font-medium text-navy-900">{detail.profile.highestCertificate || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">CSA accreditation</dt>
              <dd className="font-medium text-navy-900">
                {detail.profile.csaAccredited
                  ? CSA_ACCREDITATION_TIER_LABELS[detail.profile.csaAccreditationTier || ""] || "Accredited"
                  : "Not accredited"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Public directory</dt>
              <dd className="font-medium text-navy-900">{detail.profile.isListedInDirectory ? "Listed" : "Not listed"}</dd>
            </div>
          </dl>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={emailDraft}
                disabled={busy}
                onChange={(e) => setEmailDraft(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                disabled={busy || !emailDraft || emailDraft === detail.user.email}
                onClick={() => patch({ email: emailDraft }, "Email address updated.")}
              >
                Update
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
              <Select
                value={detail.user.role}
                disabled={busy}
                onChange={(e) => patch({ role: e.target.value }, "Role updated.")}
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Membership category</label>
              <Select
                value={detail.profile.membershipCategory || ""}
                disabled={busy}
                onChange={(e) => patch({ membershipCategory: e.target.value }, "Category updated.")}
              >
                {Object.entries(MEMBERSHIP_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {detail.applications.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Application history</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {detail.applications.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="text-slate-600">{new Date(a.submittedAt).toLocaleDateString()}</span>
                    <Badge tone={statusTone(a.status)}>{APPLICATION_STATUS_LABELS[a.status] || a.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentRole === "super_admin" && dues && (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-slate-400">Membership dues — {dues.year}</p>
                <Badge tone={dues.status === "paid" ? "accent" : dues.status === "partial" ? "amber" : "red"}>
                  {DUES_STATUS_LABELS[dues.status]}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Due</p>
                  <p className="font-medium text-navy-900">GHS {dues.duesAmountGhs.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Paid</p>
                  <p className="font-medium text-navy-900">GHS {dues.totalPaidGhs.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Balance</p>
                  <p className="font-medium text-navy-900">GHS {dues.balanceGhs.toLocaleString()}</p>
                </div>
              </div>

              {dues.payments.length > 0 ? (
                <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                  {dues.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                        {p.method === "paystack" ? "Paystack" : "Manual"}
                        {p.note ? ` — ${p.note}` : ""}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-navy-900">GHS {p.amountGhs.toLocaleString()}</span>
                        <Badge tone={statusTone(p.status === "success" ? "active" : p.status === "failed" ? "inactive" : "pending")}>
                          {p.status}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-400">No payments recorded yet.</p>
              )}

              <a href="/admin/dues" className="mt-3 inline-block text-xs font-semibold text-accent-600 hover:text-accent-700">
                Record a payment / view full report →
              </a>
            </div>
          )}
        </div>
      )}

      {detail && (
        <div className="flex flex-wrap gap-2">
          {detail.user.isActive ? (
            <Button variant="danger" disabled={busy} onClick={() => patch({ isActive: false }, "Member deactivated.")}>
              Deactivate
            </Button>
          ) : (
            <Button variant="primary" disabled={busy} onClick={() => patch({ isActive: true }, "Member reinstated.")}>
              Reinstate
            </Button>
          )}
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => patch({ resetPassword: true }, "A new temporary password has been emailed to the member.")}
          >
            Reset password
          </Button>
          {detail.user.mfaEnabled && (
            <Button variant="outline" disabled={busy} onClick={handleResetMfa}>
              Reset 2FA
            </Button>
          )}
        </div>
      )}
    </Drawer>
  );
}
