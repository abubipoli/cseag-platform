"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconCheckCircle } from "@/components/ui/icons";

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        subject: form.get("subject"),
        message: form.get("message"),
        website: form.get("website"),
      }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError("Something went wrong. Please try again, or email us directly.");
  }

  if (done) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center py-12 text-center">
          <IconCheckCircle className="h-10 w-10 text-accent-700" />
          <p className="mt-3 font-semibold text-navy-900">Message sent</p>
          <p className="mt-1 text-sm text-slate-500">We&rsquo;ll get back to you as soon as possible.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="Your name" required>
              <Input name="name" required />
            </FieldWrap>
            <FieldWrap label="Email address" required>
              <Input name="email" type="email" required />
            </FieldWrap>
          </div>
          <FieldWrap label="Subject" required>
            <Input name="subject" required />
          </FieldWrap>
          <FieldWrap label="Message" required>
            <Textarea name="message" rows={5} required />
          </FieldWrap>
          {/* Honeypot: hidden from real users via CSS, not display:none, to defeat basic bots. */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Leave this field blank
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
