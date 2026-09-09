// Password hashing + JWT session helpers.
//
// Sessions are a signed JWT stored in an httpOnly cookie ("cseag_session").
// Kept intentionally dependency-light (no full auth framework) so it is easy
// to audit for a security-focused organization — see SRS Section 7.1.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@/db/schema";

const SESSION_COOKIE = "cseag_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a random 32+ character value in your environment before starting the app."
    );
  }
  return secret;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface SessionPayload {
  userId: string;
  role: Role;
  email: string;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

// Role hierarchy used by requireRole() below. Each role also has the
// permissions of every role listed before it.
const ROLE_RANK: Record<Role, number> = {
  applicant: 0,
  member: 1,
  reviewer: 2,
  admin: 3,
  super_admin: 4,
};

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

// --- Password reset (SRS 6.5 — "forgot password self-service reset") ------
// We never store the raw token: only a SHA-256 hash of it, so a database
// leak alone can't be used to reset an account. The raw token only ever
// exists in the email link and briefly in memory here.

export function generatePasswordResetToken(): { token: string; tokenHash: string; expiresAt: string } {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  return { token, tokenHash, expiresAt };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Generates a temporary password that already satisfies the strong-password
// policy (src/lib/validation.ts#strongPasswordSchema) — the recipient is
// always told to change it, but there's no reason to hand out a weak one in
// the meantime. Excludes visually-confusable characters (0/O, 1/l/I).
export function generateTemporaryPassword(): string {
  const LOWER = "abcdefghjkmnpqrstuvwxyz";
  const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const DIGITS = "23456789";
  const SYMBOLS = "!@#$%^&*-_+=";
  const ALL = LOWER + UPPER + DIGITS + SYMBOLS;
  const LENGTH = 12;

  function randomChar(pool: string): string {
    return pool[randomBytes(1)[0] % pool.length];
  }

  const chars = [randomChar(LOWER), randomChar(UPPER), randomChar(DIGITS), randomChar(SYMBOLS)];
  while (chars.length < LENGTH) chars.push(randomChar(ALL));

  // Fisher-Yates shuffle so the guaranteed classes aren't always up front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
