"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconMail } from "@/components/ui/icons";

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setSubmitting(false);
    setDone(true);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
        <IconMail className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold text-navy-900">Forgot your password?</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Enter your account email and we&rsquo;ll send you a link to reset it.
      </p>

      <Card className="mt-6">
        <CardBody>
          {done ? (
            <p className="text-center text-sm text-slate-600">
              If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldWrap label="Email" required>
                <Input name="email" type="email" required />
              </FieldWrap>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-accent-700 hover:text-accent-800">
          Back to login
        </Link>
      </p>
    </div>
  );
}
