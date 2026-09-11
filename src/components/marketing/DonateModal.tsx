"use client";

import { useState } from "react";
import { FieldWrap, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { IconHeart, IconX } from "@/components/ui/icons";

const PRESET_AMOUNTS = [50, 100, 250, 500];

export function DonateModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount = amount ?? (Number(customAmount) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (effectiveAmount < 5) {
      setError("Minimum donation is GHS 5.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, amountGhs: effectiveAmount, message, website }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Couldn't start the donation. Please try again.");
      return;
    }
    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
      return;
    }
    // Honeypot tripped server-side — no real transaction started. Show the
    // same success state so nothing tips off whatever filled the form in.
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-950/50 backdrop-blur-[1px]" />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <IconHeart className="h-5 w-5 text-rose-500" /> Make a Donation
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <IconHeart className="h-9 w-9 text-rose-500" />
            <p className="mt-3 font-medium text-navy-900">Thank you!</p>
            <p className="mt-1 text-sm text-slate-500">Your support means a lot to us.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Amount (GHS)</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAmount(a);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-semibold transition-colors",
                      amount === a
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-slate-200 text-slate-600 hover:border-rose-300"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={5}
                placeholder="Or enter a custom amount"
                className="mt-2"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount(null);
                }}
              />
            </div>

            <FieldWrap label="Your name" required>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </FieldWrap>
            <FieldWrap label="Your email" required hint="We'll send your payment receipt here.">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </FieldWrap>
            <FieldWrap label="Message (optional)">
              <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
            </FieldWrap>
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label>
                Leave this field blank
                <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <Button type="submit" disabled={submitting || effectiveAmount < 5} className="w-full !bg-rose-500 hover:!bg-rose-400">
              {submitting ? "Redirecting to Paystack..." : `Donate GHS ${effectiveAmount || 0}`}
            </Button>
            <p className="text-center text-xs text-slate-400">Securely processed by Paystack.</p>
          </form>
        )}
      </div>
    </div>
  );
}
