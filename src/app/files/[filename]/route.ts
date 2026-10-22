// GET /files/:filename — serves a file written by /api/uploads from
// storage/uploads (see that route for why it lives outside public/).
// Served `inline` rather than as an attachment so a PDF opens straight in
// the browser's own viewer, which already gives visitors print and
// save/export-as-PDF controls with no extra UI work.
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".rtf": "application/rtf",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".zip": "application/zip",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;

  // Uploaded filenames are always randomUUID()+extension (see /api/uploads),
  // so anything containing a path separator is not a real upload — reject
  // it outright rather than letting path.join resolve outside STORAGE_DIR.
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()];
  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await readFile(path.join(STORAGE_DIR, filename)).catch(() => null);
  if (!bytes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ?download=1&name=Some Title saves the file under a readable name instead
  // of its stored UUID name.
  let disposition = `inline; filename="${filename}"`;
  if (req.nextUrl.searchParams.get("download")) {
    const base = (req.nextUrl.searchParams.get("name") || "").replace(/[\\/:*?"<>|\x00-\x1f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
    const saveAs = `${base || "CSEAG resource"}${path.extname(filename).toLowerCase()}`;
    const ascii = saveAs.replace(/[^\x20-\x7e]/g, "_");
    disposition = `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(saveAs)}`;
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
