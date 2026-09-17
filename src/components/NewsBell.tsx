"use client";

// Notification bell for the member dashboard — shows unread "News" content
// items (published via Admin > Content) as a badge, with a dropdown preview
// list. Clicking an item marks it read and takes the member to its full
// page at /news/:slug, which already renders the complete article.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBell } from "@/components/ui/icons";

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: string;
  isRead: boolean;
}

export function NewsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function load() {
    fetch("/api/member/news")
      .then((r) => r.json())
      .then((d) => {
        setNews(d.news || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function openItem(item: NewsItem) {
    setOpen(false);
    if (!item.isRead) {
      setNews((prev) => prev?.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)) || null);
      setUnreadCount((c) => Math.max(c - 1, 0));
      fetch(`/api/member/news/${item.id}/read`, { method: "POST" }).catch(() => {});
    }
    router.push(`/news/${item.slug}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        aria-label="News and updates"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <IconBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-20 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-navy-900">News &amp; updates</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {news === null ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Loading…</p>
            ) : news.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No news yet.</p>
            ) : (
              news.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex w-full items-start gap-2.5 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-accent-500"}`}
                  />
                  <span className="min-w-0">
                    <span className={`block truncate text-sm ${item.isRead ? "text-slate-600" : "font-semibold text-navy-900"}`}>
                      {item.title}
                    </span>
                    {item.summary && <span className="mt-0.5 line-clamp-2 block text-xs text-slate-400">{item.summary}</span>}
                    <span className="mt-1 block text-[11px] text-slate-400">
                      {new Date(item.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
