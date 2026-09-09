"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconLock, IconCheckCircle } from "@/components/ui/icons";
import { PasswordRequirements, isStrongPassword } from "@/components/ui/PasswordRequirements";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isStrongPassword(password)) {
      setError("Choose a password that meets all the requirements below.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "That reset link is invalid or has expired.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
        <IconLock className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-center text-2xl font-bold text-navy-900">Set a new password</h1>

      <Card className="mt-6">
        <CardBody>
          {!token ? (
            <p className="text-center text-sm text-red-600">
              This link is missing its reset token. Please use the link from your email.
            </p>
          ) : done ? (
            <div className="flex flex-col items-center py-4 text-center">
              <IconCheckCircle className="h-8 w-8 text-accent-700" />
              <p className="mt-2 text-sm font-medium text-navy-900">Password updated. Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <FieldWrap label="New password" required>
                <Input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} />
                <PasswordRequirements password={password} />
              </FieldWrap>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Saving..." : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
