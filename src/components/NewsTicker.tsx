"use client";

// A slideshow strip for the dashboard header: auto-advances through the
// member's most recent news/updates one at a time, click-through to the
// full article. Pairs with NewsBell (which covers the full list + unread
// count) — this is just the "latest headline" highlight the header wants.
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

const ROTATE_MS = 5500;
const MAX_ITEMS = 5;

export function NewsTicker() {
  const router = useRouter();
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/member/news")
      .then((r) => r.json())
      .then((d) => setItems((d.news || []).slice(0, MAX_ITEMS)))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!items || items.length < 2 || paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items, paused]);

  if (!items || items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];

  async function openCurrent() {
    if (!current.isRead) {
      fetch(`/api/member/news/${current.id}/read`, { method: "POST" }).catch(() => {});
    }
    router.push(`/news/${current.slug}`);
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] py-2 pl-3 pr-2 backdrop-blur-sm sm:rounded-2xl sm:py-2.5 sm:pl-4 sm:pr-3"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-400/20 text-sky-300">
        <IconBell className="h-3.5 w-3.5" />
      </span>

      <button
        type="button"
        onClick={openCurrent}
        className="min-w-0 flex-1 text-left"
        aria-label={`Open news item: ${current.title}`}
      >
        <span key={current.id} className="block animate-[fadeSlideIn_0.4s_ease]">
          <span className="flex items-baseline gap-2">
            {!current.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />}
            <span className="truncate text-xs font-semibold text-white sm:text-sm">{current.title}</span>
          </span>
          {current.summary && (
            <span className="mt-0.5 hidden truncate text-xs text-white/50 sm:block">{current.summary}</span>
          )}
        </span>
      </button>

      {items.length > 1 && (
        <div className="flex shrink-0 items-center gap-1 pr-1">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              aria-label={`Show update ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-sky-400" : "w-1.5 bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
