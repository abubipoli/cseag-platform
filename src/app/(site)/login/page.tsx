"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldWrap, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    if (res.ok) {
      const data = await res.json();
      router.push(data.role === "admin" || data.role === "super_admin" || data.role === "reviewer" ? "/admin" : "/dashboard");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error || "Login failed. Please check your credentials.");
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <BrandMark className="mx-auto h-14 w-14" />
      <h1 className="mt-4 text-center text-2xl font-bold text-navy-900">Member Login</h1>
      <p className="mt-1 text-center text-sm text-slate-600">Log in to manage your CSEAG profile.</p>

      <Card className="mt-6">
        <CardBody>
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Input name="password" type="password" required />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
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
