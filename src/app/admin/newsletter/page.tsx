"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldWrap, Input, Textarea } from "@/components/ui/Field";
import { IconSend, IconMail, IconDownload, IconTrash } from "@/components/ui/icons";
import { toCsv } from "@/lib/csv";

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/newsletter")
      .then((r) => (r.ok ? r.json() : { subscribers: [] }))
      .then((d) => setSubscribers(d.subscribers || []));
  }

  useEffect(load, []);

  const filtered = (subscribers || []).filter((s) => s.email.toLowerCase().includes(query.toLowerCase()));

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) {
      setResult(`Sent to ${data.sent} of ${data.total} subscriber${data.total === 1 ? "" : "s"}.`);
      setSubject("");
      setMessage("");
    } else {
      setResult(typeof data?.error === "string" ? data.error : "Couldn't send. Please try again.");
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this subscriber from the newsletter list?")) return;
    const res = await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  function handleExport() {
    const csv = toCsv(subscribers || [], [
      { key: "email", header: "Email" },
      { key: "subscribedAt", header: "Subscribed at" },
    ]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cseag-newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        description="Everyone who signed up for updates via the public 'Stay Updated' form."
        actions={
          subscribers && subscribers.length > 0 ? (
            <Button variant="outline" onClick={handleExport}>
              <IconDownload className="h-4 w-4" /> Export CSV
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-navy-900">
                Subscribers {subscribers ? `(${subscribers.length})` : ""}
              </h3>
              <Input
                placeholder="Search email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-[200px]"
              />
            </div>

            {!subscribers ? (
              <p className="mt-4 text-sm text-slate-400">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<IconMail className="h-5 w-5" />}
                  title={subscribers.length === 0 ? "No subscribers yet" : "No matches"}
                  body={
                    subscribers.length === 0
                      ? "Newsletter signups from the public site will show up here."
                      : "Try a different search."
                  }
                />
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-y border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="py-2.5 pr-3 font-medium">Email</th>
                      <th className="py-2.5 pr-3 font-medium">Subscribed</th>
                      <th className="py-2.5 pl-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 pr-3 text-navy-900">{s.email}</td>
                        <td className="py-2.5 pr-3 text-slate-500">
                          {new Date(s.subscribedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <button
                            onClick={() => handleRemove(s.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Remove subscriber"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="flex items-center gap-2 font-semibold text-navy-900">
              <IconSend className="h-4 w-4 text-accent-600" /> Send an update
            </h3>
            <p className="mt-1 text-xs text-slate-500">Emails every current subscriber. Sent as plain text/HTML, no template.</p>

            <form onSubmit={handleSend} className="mt-4 space-y-3">
              {result && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{result}</p>}
              <FieldWrap label="Subject" required>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </FieldWrap>
              <FieldWrap label="Message" required>
                <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required />
              </FieldWrap>
              <Button
                type="submit"
                disabled={sending || !subscribers?.length}
                className="w-full"
              >
                {sending ? "Sending..." : `Send to ${subscribers?.length || 0} subscriber${subscribers?.length === 1 ? "" : "s"}`}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
