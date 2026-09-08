"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconFileText, IconPlus, IconEdit, IconTrash } from "@/components/ui/icons";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import ContentEditorDrawer from "./ContentEditorDrawer";

export interface ContentItem {
  id: string;
  type: "news" | "event" | "resource" | "page";
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  imageUrl: string | null;
  fileUrl: string | null;
  status: "draft" | "published";
  eventDate: string | null;
  eventLocation: string | null;
  isMemberOnly: boolean;
  createdAt: string;
}

type ContentTab = "news" | "event" | "resource" | "page";

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [tab, setTab] = useState<ContentTab>("news");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/content");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = (items || []).filter((i) => i.type === tab);
  const counts = items
    ? {
        news: items.filter((i) => i.type === "news").length,
        event: items.filter((i) => i.type === "event").length,
        resource: items.filter((i) => i.type === "resource").length,
        page: items.filter((i) => i.type === "page").length,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        description="Publish news, events, resources, and static pages without a developer."
        actions={
          <Button onClick={() => setCreating(true)}>
            <IconPlus className="h-4 w-4" /> New {CONTENT_TYPE_LABELS[tab]}
          </Button>
        }
      />

      <Tabs<ContentTab>
        active={tab}
        onChange={setTab}
        counts={counts}
        tabs={[
          { value: "news", label: "News" },
          { value: "event", label: "Events" },
          { value: "resource", label: "Resources" },
          { value: "page", label: "Pages" },
        ]}
      />

      {!items ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<IconFileText className="h-5 w-5" />} title={`No ${CONTENT_TYPE_LABELS[tab].toLowerCase()} yet`} action={<Button onClick={() => setCreating(true)}>Create one</Button>} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardBody className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-navy-900">{item.title}</p>
                    <Badge tone={item.status === "published" ? "accent" : "amber"}>{item.status}</Badge>
                    {item.isMemberOnly && <Badge tone="navy">Members only</Badge>}
                  </div>
                  <p className="truncate text-xs text-slate-400">/{item.type}/{item.slug}</p>
                </div>
                <button onClick={() => setEditing(item)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy-900">
                  <IconEdit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <IconTrash className="h-4 w-4" />
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ContentEditorDrawer
        open={creating || !!editing}
        item={editing}
        defaultType={tab}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}
