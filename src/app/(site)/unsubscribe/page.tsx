"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconMail, IconCheckCircle } from "@/components/ui/icons";

// A real button click, not just loading this page, actually unsubscribes —
// deliberate, since some email clients and corporate security scanners
// pre-fetch every link in an email, which would silently unsubscribe
// people who never clicked anything if a plain page-load did it instead.
function UnsubscribeForm() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnsubscribe() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
        <IconMail className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold text-navy-900">Unsubscribe</h1>

      <Card className="mt-6">
        <CardBody>
          {!id ? (
            <p className="text-center text-sm text-red-600">
              This link is missing its unsubscribe reference. Please use the link from your email.
            </p>
          ) : done ? (
            <div className="flex flex-col items-center py-4 text-center">
              <IconCheckCircle className="h-8 w-8 text-accent-700" />
              <p className="mt-2 text-sm font-medium text-navy-900">You&rsquo;ve been unsubscribed.</p>
              <p className="mt-1 text-xs text-slate-500">You won&rsquo;t receive any more CSEAG newsletter emails.</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-slate-600">
                Stop receiving CSEAG newsletter emails? You can always sign up again later.
              </p>
              {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <Button onClick={handleUnsubscribe} disabled={submitting} className="mt-4 w-full">
                {submitting ? "Unsubscribing..." : "Yes, unsubscribe me"}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/" className="font-medium text-accent-700 hover:text-accent-800">
          Back to homepage
        </Link>
      </p>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeForm />
    </Suspense>
  );
}
