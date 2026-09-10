"use client";

// Shared print/export view for an admin report: fetches the report's JSON
// rows and renders a plain table meant to look right both on screen and on
// paper. AdminShell hides the sidebar/topbar under a `print:` media query,
// so calling window.print() here effectively gives "export to PDF" for
// free via the browser's own print dialog — no server-side PDF renderer
// needed.
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { IconPrinter, IconDownload, IconFileSpreadsheet, IconArrowRight } from "@/components/ui/icons";

export interface ReportColumnDef<T> {
  key: keyof T;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right";
}

export function ReportView<T extends object>({
  title,
  description,
  apiBase,
  columns,
  summary,
}: {
  title: string;
  description: string;
  apiBase: string;
  columns: ReportColumnDef<T>[];
  // Optional stats strip rendered above the table, computed by the caller
  // from the same rows this component fetches (kept in the caller so each
  // report can define its own aggregates without this component needing to
  // know what they mean).
  summary?: (rows: T[]) => React.ReactNode;
}) {
  const [rows, setRows] = useState<T[] | null>(null);

  useEffect(() => {
    fetch(`${apiBase}?format=json`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows);
  }, [apiBase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <PageHeader title={title} description={description} />
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/reports" className="inline-flex items-center gap-1.5 self-center text-sm font-medium text-slate-500 hover:text-accent-700">
            <IconArrowRight className="h-4 w-4 rotate-180" /> All reports
          </Link>
          <Button variant="outline" onClick={() => window.print()}>
            <IconPrinter className="h-4 w-4" /> Print / Save as PDF
          </Button>
          <a href={`${apiBase}?format=csv`} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-accent-500 hover:text-accent-700">
            <IconDownload className="h-4 w-4" /> CSV
          </a>
          <a href={`${apiBase}?format=xlsx`} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-accent-500 hover:text-accent-700">
            <IconFileSpreadsheet className="h-4 w-4" /> Excel
          </a>
        </div>
      </div>

      {/* Print-only header — the on-screen PageHeader above is hidden when
          printing, so the printed page still needs a title. */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-navy-900">{title}</h1>
        <p className="text-sm text-slate-500">
          {description} · Generated {new Date().toLocaleString()}
        </p>
      </div>

      {rows && summary?.(rows)}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)] print:rounded-none print:border-0 print:shadow-none">
        {!rows ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No data yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 print:bg-transparent">
              <tr>
                {columns.map((c) => (
                  <th
                    key={String(c.key)}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${c.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => (
                <tr key={i} className="break-inside-avoid">
                  {columns.map((c) => (
                    <td key={String(c.key)} className={`px-4 py-2.5 text-slate-700 ${c.align === "right" ? "text-right" : "text-left"}`}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
