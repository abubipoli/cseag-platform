"use client";

import { useState } from "react";
import { FieldWrap, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconCheckCircle, IconX } from "@/components/ui/icons";

export default function RequestServiceModal({
  expertId,
  expertName,
  onClose,
}: {
  expertId: string;
  expertName: string;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/experts/${expertId}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterName: form.get("requesterName"),
        requesterEmail: form.get("requesterEmail"),
        requesterPhone: form.get("requesterPhone"),
        message: form.get("message"),
        website: form.get("website"),
      }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError("Something went wrong. Please try again.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-950/50 backdrop-blur-[1px]" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-navy-900">Request {expertName}&rsquo;s services</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Tell us what you need. A CSEAG administrator will review your request and connect you with {expertName.split(" ")[0]} —
          their contact details aren&rsquo;t shared directly.
        </p>

        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <IconCheckCircle className="h-9 w-9 text-accent-700" />
            <p className="mt-3 font-medium text-navy-900">Request sent</p>
            <p className="mt-1 text-sm text-slate-500">Our team will be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <FieldWrap label="Your name" required>
              <Input name="requesterName" required />
            </FieldWrap>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrap label="Your email" required>
                <Input name="requesterEmail" type="email" required />
              </FieldWrap>
              <FieldWrap label="Phone (optional)">
                <Input name="requesterPhone" placeholder="+233241234567" />
              </FieldWrap>
            </div>
            <FieldWrap label="What do you need help with?" required>
              <Textarea name="message" rows={4} required />
            </FieldWrap>
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label>
                Leave this field blank
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Sending..." : "Send Request"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
