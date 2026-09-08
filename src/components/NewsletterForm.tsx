"use client";

import { useState } from "react";
import { IconArrowRight } from "@/components/ui/icons";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "done" : "error");
    if (res.ok) setEmail("");
  }

  if (status === "done") {
    return <p className="mt-4 text-sm font-medium text-accent-400">You&rsquo;re subscribed. Thank you!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full min-w-0 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent-400/60 focus:outline-none focus:ring-2 focus:ring-accent-400/40"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        aria-label="Subscribe"
        className="flex shrink-0 items-center justify-center rounded-full bg-accent-500 px-3 text-navy-950 hover:bg-accent-400 disabled:opacity-60"
      >
        <IconArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
