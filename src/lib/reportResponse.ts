// Shared "give me this data as csv/xlsx/json" responder for admin reports
// (SRS 6.7 reporting/export). One column list drives all three formats, so
// a report's shape only has to be defined once.
import { NextResponse } from "next/server";
import { toCsv } from "./csv";
import { toXlsx } from "./xlsx";

export type ReportColumn<T> = { key: keyof T; header: string };
export type ReportFormat = "csv" | "xlsx" | "json";

export function parseReportFormat(value: string | null): ReportFormat {
  return value === "xlsx" || value === "json" ? value : "csv";
}

export async function reportResponse<T extends object>(
  format: ReportFormat,
  rows: T[],
  columns: ReportColumn<T>[],
  filenameBase: string
): Promise<NextResponse> {
  const date = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return NextResponse.json(rows);
  }

  if (format === "xlsx") {
    const buffer = await toXlsx(rows, columns, filenameBase);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filenameBase}-${date}.xlsx"`,
      },
    });
  }

  const csv = toCsv(rows, columns);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filenameBase}-${date}.csv"`,
    },
  });
}
