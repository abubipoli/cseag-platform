"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown } from "@/components/ui/icons";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// A compact month-grid calendar highlighting days that have an event, with
// prev/next navigation. Purely a visual index into the event list rendered
// alongside it — clicking a day is not wired to anything.
export function MiniCalendar({ eventDates }: { eventDates: string[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const markedDays = new Set(
    eventDates
      .map((raw) => {
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? null : dateKey(d);
      })
      .filter((v): v is string => !!v)
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = dateKey(new Date());

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Previous month"
        >
          <IconChevronDown className="h-4 w-4 rotate-90" />
        </button>
        <p className="text-sm font-semibold text-navy-900">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Next month"
        >
          <IconChevronDown className="h-4 w-4 -rotate-90" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEvent = markedDays.has(key);
          const isToday = key === today;
          return (
            <span
              key={i}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs",
                isToday && "font-bold text-accent-700 ring-1 ring-accent-300",
                hasEvent && !isToday && "bg-accent-500 font-semibold text-navy-950",
                !hasEvent && !isToday && "text-slate-600"
              )}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
