// POST /api/uploads — stores an uploaded file (CV, certification proof,
// profile photo, content image/attachment — SRS 6.2 / 6.5 / 6.9) and
// returns its public URL.
//
// Written to storage/uploads — a sibling of public/, not inside it. The
// production deploy process fully replaces public/, node_modules, .next,
// server.js, and package.json on every release, but leaves any other
// top-level directory alone; storage/ is deliberately outside that blast
// radius so uploaded files survive deploys. Served back same-origin via
// /files/[filename] (see src/app/files/[filename]/route.ts) rather than a
// third-party host, so a public download link never exposes a storage
// provider's domain.
//
// Deliberately allowed without a session: the public membership application
// (SRS 6.2) needs to attach a CV/certification before an account exists.
// Abuse resistance instead comes from a strict extension allow-list, a 25MB
// cap, and random non-guessable filenames.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — resource PDFs/decks routinely exceed 8MB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp"]);
const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 25MB)" }, { status: 413 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: PDF, Word, PNG, JPG, WEBP." },
      { status: 415 }
    );
  }

  const filename = `${randomUUID()}${ext}`;
  await mkdir(STORAGE_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(STORAGE_DIR, filename), bytes);

  return NextResponse.json({ url: `/files/${filename}` }, { status: 201 });
}
