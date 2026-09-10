"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, Input, PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/BrandMark";
import { IconShieldCheck } from "@/components/ui/icons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [idleNotice] = useState(searchParams.get("reason") === "idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  function goToDestination(role: string) {
    router.push(role === "admin" || role === "super_admin" || role === "reviewer" ? "/admin" : "/dashboard");
    router.refresh();
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.mfaRequired) {
      setMfaToken(data.mfaToken);
      return;
    }
    if (res.ok) {
      goToDestination(data.role);
      return;
    }
    setError(data.error || "Login failed. Please check your credentials.");
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaToken) return;
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/login/verify-mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfaToken, code: mfaCode }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      goToDestination(data.role);
      return;
    }
    setError(data.error || "That code isn't valid.");
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <BrandMark className="mx-auto h-14 w-14" />
      <h1 className="mt-4 text-center text-2xl font-bold text-navy-900">Member Login</h1>
      <p className="mt-1 text-center text-sm text-slate-600">
        {mfaToken ? "Enter your two-factor authentication code." : "Log in to manage your CSEAG profile."}
      </p>

      <Card className="mt-6">
        <CardBody>
          {idleNotice && !error && (
            <div className="mb-4 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-800">
              You were logged out after a period of inactivity. Please log in again.
            </div>
          )}
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {mfaToken ? (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                  <IconShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-600">MFA</span>
              </div>
              <FieldWrap label="Authentication code" required hint="From your authenticator app, or a backup code.">
                <Input
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  autoFocus
                  required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </FieldWrap>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Verifying..." : "Verify & log in"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMfaToken(null);
                  setMfaCode("");
                  setError(null);
                }}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                ← Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <FieldWrap label="Email" required>
                <Input name="email" type="email" required autoFocus />
              </FieldWrap>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-xs font-medium text-accent-700 hover:text-accent-800">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput name="password" required />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Logging in..." : "Log in"}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-600">
        Not a member yet?{" "}
        <Link href="/apply" className="font-medium text-accent-700 hover:text-accent-800">
          Apply here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
