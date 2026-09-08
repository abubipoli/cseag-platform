// Kairos Afrika SMS gateway adapter.
//
// Contract confirmed against Kairos Afrika's official `@kairosafrika/sms`
// SDK (github.com/Kairos-Afrika/sms-node): fixed API host, `x-api-key` /
// `x-api-secret` headers (not HTTP Basic Auth), and specific endpoint paths
// — none of which are documented on their public site, so this mirrors the
// SDK's implementation rather than guessing.

import type { SmsProvider, SmsMessage, SendResult } from "../types";

const KAIROS_BASE_URL = "https://api.kairosafrika.com/v1";

/** Kairos expects MSISDNs without a leading "+", e.g. "233200746423". */
function normalizePhone(phone: string): string {
  const digits = phone.trim().replace(/[\s-]/g, "").replace(/^\+/, "");
  return digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
}

export function createKairosSmsProvider(config: { apiKey: string; apiSecret: string; senderId: string }): SmsProvider {
  const authHeaders = { "x-api-key": config.apiKey, "x-api-secret": config.apiSecret };

  return {
    name: "kairos",
    async send(message: SmsMessage): Promise<SendResult> {
      try {
        const res = await fetch(`${KAIROS_BASE_URL}/external/sms/quick`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders },
          body: JSON.stringify({
            to: normalizePhone(message.to),
            from: config.senderId || "CSEAG",
            message: message.body,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          return { ok: false, error: data?.statusMessage || `Kairos Afrika returned HTTP ${res.status}` };
        }
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  };
}
