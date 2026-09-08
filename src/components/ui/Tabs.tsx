"use client";

import { cn } from "@/lib/cn";

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  counts,
}: {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-full px-3.5 py-1.5 font-medium transition-colors",
            active === tab.value ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          )}
        >
          {tab.label}
          {counts?.[tab.value] !== undefined && (
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-xs",
                active === tab.value ? "bg-accent-50 text-accent-700" : "bg-slate-200 text-slate-500"
              )}
            >
              {counts[tab.value]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
