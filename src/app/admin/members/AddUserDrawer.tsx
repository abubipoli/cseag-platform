"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { FieldWrap, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ROLE_LABELS, MEMBERSHIP_CATEGORY_LABELS } from "@/lib/constants";

// Reviewer creates staff/member accounts too, but only a super admin may
// grant admin/super_admin — restricting the option client-side is just UX;
// the API enforces it regardless.
function assignableRoles(currentRole: string) {
  return Object.entries(ROLE_LABELS).filter(([value]) => {
    if (value === "admin" || value === "super_admin") return currentRole === "super_admin";
    return true;
  });
}

export default function AddUserDrawer({
  open,
  currentRole,
  onClose,
  onCreated,
}: {
  open: boolean;
  currentRole: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "member", membershipCategory: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setForm({ fullName: "", email: "", phone: "", role: "member", membershipCategory: "" });
    setError(null);
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, membershipCategory: form.membershipCategory || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      reset();
      onCreated();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error?.formErrors?.[0] || "Couldn't create the account. Check the fields and try again.");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add user"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? "Creating..." : "Create account"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Creates an account directly — for members you&rsquo;re promoting, or staff who don&rsquo;t need to go through
          the public application. A temporary password is emailed (and texted, if a phone is on file) to them.
        </p>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <FieldWrap label="Full name" required>
          <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
        </FieldWrap>
        <FieldWrap label="Email address" required>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </FieldWrap>
        <FieldWrap label="Phone number" required hint="e.g. +233241234567">
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </FieldWrap>
        <FieldWrap label="Role" required>
          <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {assignableRoles(currentRole).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldWrap>
        {form.role === "member" && (
          <FieldWrap label="Membership category">
            <Select value={form.membershipCategory} onChange={(e) => setForm((f) => ({ ...f, membershipCategory: e.target.value }))}>
              <option value="">Not set</option>
              {Object.entries(MEMBERSHIP_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FieldWrap>
        )}
      </div>
    </Drawer>
  );
}
