"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FieldWrap, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconCheckCircle } from "@/components/ui/icons";

export default function RsvpForm({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        website: form.get("website"),
      }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError("Something went wrong submitting your RSVP. Please try again.");
  }

  if (done) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center py-10 text-center">
          <IconCheckCircle className="h-9 w-9 text-accent-700" />
          <p className="mt-3 font-semibold text-navy-900">You&rsquo;re registered for {eventTitle}</p>
          <p className="mt-1 text-sm text-slate-500">Check your email for confirmation details.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold text-navy-900">RSVP for this event</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="Full name" required>
              <Input name="name" required />
            </FieldWrap>
            <FieldWrap label="Email" required>
              <Input name="email" type="email" required />
            </FieldWrap>
          </div>
          <FieldWrap label="Phone (optional)">
            <Input name="phone" placeholder="+233241234567" />
          </FieldWrap>
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Leave this field blank
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Submitting..." : "Confirm RSVP"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
