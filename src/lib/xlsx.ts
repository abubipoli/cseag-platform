// Excel (.xlsx) export helper for admin reports, mirroring the shape of
// toCsv() in lib/csv.ts. Uses exceljs (write-only usage here — we never
// parse an uploaded file with it) rather than the more commonly-suggested
// "xlsx"/SheetJS package, which has long-standing unpatched prototype
// pollution / ReDoS advisories on the npm-published build.
import ExcelJS from "exceljs";

export async function toXlsx<T extends object>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
  sheetName = "Report"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: String(c.key), width: 22 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
