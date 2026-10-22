"use client";

// One library item: a document preview on the left, the title and write-up
// on the right, with Preview and Download actions. Used by the public
// Resources page and the member dashboard so both look the same.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { IconDownload, IconEye, IconFileText, IconLock, IconX } from "@/components/ui/icons";

export interface ResourceCardItem {
  id: string;
  title: string;
  summary: string | null;
  fileUrl: string | null;
  isMemberOnly: boolean;
  publishedAt?: string | null;
  createdAt?: string | null;
}

type Kind = "pdf" | "image" | "doc" | "other";

function fileKind(url: string | null): { kind: Kind; ext: string } {
  const ext = (url?.split("?")[0].split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return { kind: "pdf", ext };
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return { kind: "image", ext };
  if (["doc", "docx"].includes(ext)) return { kind: "doc", ext };
  return { kind: "other", ext };
}

// Local uploads can be saved under the resource's own title instead of the
// random file name they are stored with.
function downloadHref(fileUrl: string, title: string): string {
  if (!fileUrl.startsWith("/files/")) return fileUrl;
  return `${fileUrl}?download=1&name=${encodeURIComponent(title)}`;
}

function Preview({ url, kind, ext }: { url: string; kind: Kind; ext: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
        <IconFileText className="h-8 w-8" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{ext || "file"}</span>
      </div>
      {kind === "pdf" && (
        <iframe
          src={`${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          title="Document preview"
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-white"
        />
      )}
      {kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded resource image
        <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  );
}

function Viewer({ item, kind, onClose }: { item: ResourceCardItem; kind: Kind; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const url = item.fileUrl!;
  return (
    <div role="dialog" aria-modal="true" aria-label={item.title} className="fixed inset-0 z-[100] flex flex-col bg-navy-900/80 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <p className="line-clamp-1 flex-1 text-sm font-semibold text-navy-900">{item.title}</p>
          <a
            href={downloadHref(url, item.title)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-700"
          >
            <IconDownload className="h-4 w-4" /> Download
          </a>
          <button type="button" onClick={onClose} aria-label="Close preview" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 bg-slate-100">
          {kind === "pdf" ? (
            <iframe src={url} title={item.title} className="h-full w-full border-0" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded resource image
            <img src={url} alt={item.title} className="mx-auto h-full w-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}

export function ResourceCard({ item, locked = false }: { item: ResourceCardItem; locked?: boolean }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { kind, ext } = fileKind(item.fileUrl);
  const canPreview = !locked && !!item.fileUrl && (kind === "pdf" || kind === "image");
  const uploaded = item.publishedAt || item.createdAt;
  const longSummary = (item.summary?.length ?? 0) > 220;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg sm:flex-row">
      <div className="relative h-44 shrink-0 border-b border-slate-200 sm:h-auto sm:w-48 sm:border-b-0 sm:border-r md:w-56">
        {item.fileUrl && !locked ? (
          <button
            type="button"
            disabled={!canPreview}
            onClick={() => setOpen(true)}
            aria-label={canPreview ? `Preview ${item.title}` : undefined}
            className="group absolute inset-0 block h-full w-full cursor-pointer disabled:cursor-default"
          >
            <Preview url={item.fileUrl} kind={kind} ext={ext} />
            {canPreview && (
              <span className="absolute inset-0 flex items-center justify-center bg-navy-900/0 opacity-0 transition group-hover:bg-navy-900/50 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy-900">
                  <IconEye className="h-4 w-4" /> Preview
                </span>
              </span>
            )}
          </button>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400">
            {locked ? <IconLock className="h-8 w-8" /> : <IconFileText className="h-8 w-8" />}
            <span className="text-[10px] font-semibold uppercase tracking-wider">{locked ? "Members only" : "No file"}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {ext && item.fileUrl && <Badge tone="accent">{ext.toUpperCase()}</Badge>}
          {item.isMemberOnly && <Badge tone="navy">Members only</Badge>}
        </div>
        <h3 className="font-serif-display mt-2 text-lg leading-snug text-navy-900">{item.title}</h3>
        {uploaded && (
          <p className="mt-1 text-xs text-slate-500">
            Uploaded {new Date(uploaded).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        {item.summary && (
          <div className="mt-2">
            <p className={`whitespace-pre-line text-sm leading-relaxed text-slate-600 ${expanded ? "" : "line-clamp-4"}`}>{item.summary}</p>
            {longSummary && (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-semibold text-accent-700 hover:text-accent-800">
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {locked ? (
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:border-accent-500 hover:text-accent-700">
              <IconLock className="h-4 w-4" /> Log in to access
            </Link>
          ) : item.fileUrl ? (
            <>
              <a
                href={downloadHref(item.fileUrl, item.title)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-700"
              >
                <IconDownload className="h-4 w-4" /> Download
              </a>
              {canPreview && (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <IconEye className="h-4 w-4" /> Preview
                </button>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-400">No file attached</span>
          )}
        </div>
      </div>

      {open && item.fileUrl && <Viewer item={item} kind={kind} onClose={() => setOpen(false)} />}
    </article>
  );
}
