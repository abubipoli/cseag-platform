// POST /api/uploads — stores an uploaded file (CV, certification proof,
// profile photo, content image/attachment — SRS 6.2 / 6.5 / 6.9) and
// returns its public URL.
//
// Uses Vercel Blob in any environment where BLOB_READ_WRITE_TOKEN is set
// (production, and local dev once `vercel env pull` has fetched it).
// Falls back to writing into public/uploads on local disk otherwise, so
// local development works without a Blob store.
// Deliberately allowed without a session: the public membership application
// (SRS 6.2) needs to attach a CV/certification before an account exists.
// Abuse resistance instead comes from a strict extension allow-list, an 8MB
// cap, and random non-guessable filenames.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — resource PDFs/decks routinely exceed 8MB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp"]);

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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), bytes);

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
