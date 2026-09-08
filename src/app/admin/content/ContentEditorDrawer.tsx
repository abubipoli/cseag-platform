"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { FieldWrap, Input, Textarea, Select, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { IconUpload } from "@/components/ui/icons";
import type { ContentItem } from "./page";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ContentEditorDrawer({
  open,
  item,
  defaultType,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: ContentItem | null;
  defaultType: ContentItem["type"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    type: defaultType,
    slug: "",
    title: "",
    summary: "",
    body: "",
    status: "draft" as "draft" | "published",
    eventDate: "",
    eventLocation: "",
    isMemberOnly: false,
    fileUrl: "",
    imageUrl: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- resetting local form
       state to match the item passed in is exactly what this effect exists
       for; it's not synchronizing with an external system. */
    if (item) {
      setForm({
        type: item.type,
        slug: item.slug,
        title: item.title,
        summary: item.summary || "",
        body: item.body,
        status: item.status,
        eventDate: item.eventDate ? item.eventDate.slice(0, 16) : "",
        eventLocation: item.eventLocation || "",
        isMemberOnly: item.isMemberOnly,
        fileUrl: item.fileUrl || "",
        imageUrl: item.imageUrl || "",
      });
      setSlugTouched(true);
    } else {
      setForm({
        type: defaultType,
        slug: "",
        title: "",
        summary: "",
        body: "",
        status: "draft",
        eventDate: "",
        eventLocation: "",
        isMemberOnly: false,
        fileUrl: "",
        imageUrl: "",
      });
      setSlugTouched(false);
    }
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [item, defaultType, open]);

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, fileUrl: data.url }));
    }
  }

  async function handleImageUpload(file: File) {
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    setUploadingImage(false);
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({ ...f, imageUrl: data.url }));
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload = { ...form, eventDate: form.eventDate || undefined, eventLocation: form.eventLocation || undefined };
    const res = await fetch(item ? `/api/admin/content/${item.id}` : "/api/admin/content", {
      method: item ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error?.formErrors?.[0] || "Couldn't save. Check the fields and try again.");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={item ? "Edit content" : "New content"}
      wide
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrap label="Type" required>
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContentItem["type"] }))}>
              <option value="news">News</option>
              <option value="event">Event</option>
              <option value="resource">Resource</option>
              <option value="page">Page</option>
            </Select>
          </FieldWrap>
          <FieldWrap label="Status" required>
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </FieldWrap>
        </div>

        <FieldWrap label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
            }}
          />
        </FieldWrap>

        <FieldWrap label="Slug" required hint="Used in the public URL, e.g. /news/your-slug">
          <Input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, slug: e.target.value }));
            }}
          />
        </FieldWrap>

        <FieldWrap label="Summary" hint="Short teaser shown in listings.">
          <Textarea rows={2} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
        </FieldWrap>

        <FieldWrap label="Picture" hint="Shown on listings and the detail page.">
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary uploaded asset
            <img src={form.imageUrl} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />
          )}
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-5 text-center hover:border-accent-400">
            <IconUpload className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-600">
              {uploadingImage ? "Uploading..." : form.imageUrl ? "Click to replace" : "Click to upload a picture"}
            </span>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
          </label>
        </FieldWrap>

        <FieldWrap label="Body" required>
          <Textarea rows={8} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
        </FieldWrap>

        {form.type === "event" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="Event date &amp; time">
              <Input type="datetime-local" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} />
            </FieldWrap>
            <FieldWrap label="Location">
              <Input value={form.eventLocation} onChange={(e) => setForm((f) => ({ ...f, eventLocation: e.target.value }))} />
            </FieldWrap>
          </div>
        )}

        {form.type === "resource" && (
          <FieldWrap label="Attachment">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-5 text-center hover:border-accent-400">
              <IconUpload className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-600">{uploading ? "Uploading..." : form.fileUrl ? "File attached — click to replace" : "Click to upload a file"}</span>
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
            <Checkbox
              className="mt-3"
              label="Members only"
              description="Only logged-in members can download this."
              checked={form.isMemberOnly}
              onChange={(e) => setForm((f) => ({ ...f, isMemberOnly: e.target.checked }))}
            />
          </FieldWrap>
        )}
      </div>
    </Drawer>
  );
}
