"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PasswordRequirements, isStrongPassword } from "@/components/ui/PasswordRequirements";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isStrongPassword(newPassword)) {
      setError("Choose a new password that meets all the requirements below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSubmitting(false);

    if (res.ok) {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(typeof data?.error === "string" ? data.error : "Couldn't update your password. Check the fields and try again.");
    }
  }

  return (
    <Card>
      <CardBody>
        <h3 className="font-semibold text-navy-900">Change password</h3>
        <p className="mt-1 text-sm text-slate-500">You'll stay logged in on this device after changing it.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">Password updated.</p>}

          <FieldWrap label="Current password" required>
            <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </FieldWrap>
          <FieldWrap label="New password" required>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={10} />
            <PasswordRequirements password={newPassword} />
          </FieldWrap>
          <FieldWrap label="Confirm new password" required>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </FieldWrap>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Update password"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
