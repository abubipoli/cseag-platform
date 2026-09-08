"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { IconSend } from "@/components/ui/icons";

interface Message {
  id: string;
  senderRole: "expert" | "requester" | "admin";
  senderName: string;
  message: string;
  createdAt: string;
}

interface ThreadData {
  viewerRole: "expert" | "admin" | "requester";
  ticket: {
    id: string;
    status: string;
    message: string;
    requesterName: string;
    expertName: string | null;
    assigned: boolean;
  };
  messages: Message[];
}

// Shared chat UI for the monitored expert<->requester thread — used on the
// admin ticket drawer (read + can post), the member dashboard's "My
// Requests" tab (the expert), and the public token-gated page (the
// requester, who has no account).
export function ServiceRequestChat({ serviceRequestId, token }: { serviceRequestId: string; token?: string }) {
  const [data, setData] = useState<ThreadData | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  async function load() {
    const res = await fetch(`/api/service-requests/${serviceRequestId}/messages${query}`);
    if (res.ok) {
      setData(await res.json());
      setError(null);
    } else if (res.status === 403) {
      setError("You don't have access to this conversation.");
    } else if (res.status === 404) {
      setError("This conversation could not be found.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceRequestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const res = await fetch(`/api/service-requests/${serviceRequestId}/messages${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: draft.trim() }),
    });
    setSending(false);
    if (res.ok) {
      setDraft("");
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Couldn't send that message.");
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Loading conversation…</p>;

  if (!data.ticket.assigned) {
    return <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">This request hasn&rsquo;t been assigned to an expert yet.</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="max-h-96 min-h-[12rem] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-4 scrollbar-thin">
        {data.messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">No messages yet — say hello to get started.</p>
        )}
        {data.messages.map((m) => (
          <ChatBubble key={m.id} message={m} viewerRole={data.viewerRole} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          rows={2}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button type="submit" disabled={sending || !draft.trim()}>
          <IconSend className="h-4 w-4" />
        </Button>
      </form>
      {data.viewerRole === "admin" && (
        <p className="mt-2 text-xs text-slate-400">You&rsquo;re viewing this thread for quality monitoring. Messages you send are visible to both sides.</p>
      )}
    </div>
  );
}

function ChatBubble({ message, viewerRole }: { message: Message; viewerRole: ThreadData["viewerRole"] }) {
  const isOwn = message.senderRole === viewerRole || (viewerRole === "admin" && message.senderRole === "admin");
  const toneByRole: Record<Message["senderRole"], string> = {
    expert: "bg-accent-600 text-white",
    requester: "bg-white border border-slate-200 text-slate-700",
    admin: "bg-navy-900 text-white",
  };

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm", toneByRole[message.senderRole])}>
        {message.message}
      </div>
      <span className="mt-1 px-1 text-[11px] text-slate-400">
        {message.senderName} · {new Date(message.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}
