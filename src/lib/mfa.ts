// TOTP-based two-factor authentication (RFC 6238), via an authenticator app
// (Google Authenticator, Authy, Microsoft Authenticator, etc.) — see
// src/lib/auth.ts for the login-time "MFA challenge" token that bridges the
// password step and the code-verification step.

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { randomBytes, createHash } from "node:crypto";
import { SITE_CONFIG } from "@/lib/constants";

function buildTotp(secretBase32: string, label?: string) {
  return new OTPAuth.TOTP({
    issuer: SITE_CONFIG.name,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function generateMfaSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export async function buildEnrollmentAssets(secretBase32: string, accountEmail: string) {
  const totp = buildTotp(secretBase32, accountEmail);
  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { otpauthUrl, qrCodeDataUrl };
}

/** Accepts a code from slightly before/after "now" (±30s) to tolerate clock drift. */
export function verifyTotpCode(secretBase32: string, code: string): boolean {
  const cleaned = code.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const totp = buildTotp(secretBase32);
  return totp.validate({ token: cleaned, window: 1 }) !== null;
}

export interface BackupCodeRecord {
  hash: string;
  usedAt: string | null;
}

function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}

/** Returns the plaintext codes (shown to the user once) and the hashed records to store. */
export function generateBackupCodes(count = 8): { plain: string[]; records: BackupCodeRecord[] } {
  const plain = Array.from({ length: count }, () => randomBytes(5).toString("hex")); // 10 hex chars each
  const records = plain.map((code) => ({ hash: hashBackupCode(code), usedAt: null }));
  return { plain, records };
}

/**
 * Checks `code` against the stored backup codes and, if it matches an unused
 * one, returns the updated records with it marked used (caller must persist
 * this). Returns null if the code doesn't match any unused record.
 */
export function consumeBackupCode(records: BackupCodeRecord[], code: string): BackupCodeRecord[] | null {
  const hash = hashBackupCode(code);
  const index = records.findIndex((r) => r.hash === hash && !r.usedAt);
  if (index === -1) return null;
  const next = [...records];
  next[index] = { ...next[index], usedAt: new Date().toISOString() };
  return next;
}
