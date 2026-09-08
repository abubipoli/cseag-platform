"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldWrap, Input, Textarea, Select } from "@/components/ui/Field";
import { IconMail, IconSend } from "@/components/ui/icons";

interface NotificationRow {
  id: string;
  channel: "email" | "sms";
  templateKey: string;
  recipient: string;
  recipientName: string | null;
  status: "sent" | "failed" | "queued";
  errorMessage: string | null;
  sentAt: string;
}

export default function CommunicationsPage() {
  const [log, setLog] = useState<NotificationRow[] | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState({
    audience: "all_members",
    channel: "email" as "email" | "sms" | "both",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/notifications");
    const data = await res.json();
    setLog(data.notifications || []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleResend(id: string) {
    setResendingId(id);
    await fetch(`/api/admin/notifications/${id}/resend`, { method: "POST" });
    setResendingId(null);
    load();
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    const res = await fetch("/api/admin/notifications/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(broadcast),
    });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      setResult(`Sent to ${data.sent} recipient(s).`);
      setBroadcast((b) => ({ ...b, subject: "", message: "" }));
      load();
    } else {
      setResult("Something went wrong sending that broadcast.");
    }
  }

  const failedCount = log?.filter((n) => n.status === "failed").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Communications" description="Send targeted messages and review the notification log." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <p className="font-semibold text-navy-900">Compose a message</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleBroadcast} className="space-y-4">
              {result && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{result}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrap label="Audience" required>
                  <Select value={broadcast.audience} onChange={(e) => setBroadcast((b) => ({ ...b, audience: e.target.value }))}>
                    <option value="all_members">All members</option>
                    <option value="applicants">Applicants</option>
                    <option value="reviewers_admins">Reviewers &amp; admins</option>
                  </Select>
                </FieldWrap>
                <FieldWrap label="Channel" required>
                  <Select value={broadcast.channel} onChange={(e) => setBroadcast((b) => ({ ...b, channel: e.target.value as typeof broadcast.channel }))}>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="both">Email &amp; SMS</option>
                  </Select>
                </FieldWrap>
              </div>
              <FieldWrap label="Subject" required hint="Used as the email subject line.">
                <Input value={broadcast.subject} onChange={(e) => setBroadcast((b) => ({ ...b, subject: e.target.value }))} required />
              </FieldWrap>
              <FieldWrap label="Message" required hint="Use {{name}} to personalize with the recipient's name.">
                <Textarea rows={6} value={broadcast.message} onChange={(e) => setBroadcast((b) => ({ ...b, message: e.target.value }))} required />
              </FieldWrap>
              <Button type="submit" disabled={sending} className="w-full">
                <IconSend className="h-4 w-4" /> {sending ? "Sending..." : "Send"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <p className="font-semibold text-navy-900">Notification log</p>
            {failedCount > 0 && <Badge tone="red">{failedCount} failed</Badge>}
          </CardHeader>
          <CardBody className="max-h-[560px] overflow-y-auto scrollbar-thin">
            {!log ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : log.length === 0 ? (
              <EmptyState icon={<IconMail className="h-5 w-5" />} title="No notifications sent yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {log.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">
                        {n.recipientName || n.recipient} <span className="text-xs font-normal text-slate-400">· {n.channel.toUpperCase()}</span>
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {n.templateKey.replace(/_/g, " ")} · {new Date(n.sentAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={statusTone(n.status)}>{n.status}</Badge>
                      {n.status === "failed" && (
                        <button
                          onClick={() => handleResend(n.id)}
                          disabled={resendingId === n.id}
                          className="text-xs font-semibold text-accent-700 hover:text-accent-800 disabled:opacity-50"
                        >
                          {resendingId === n.id ? "Resending…" : "Resend"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
