// mNotify SMS provider (Ghana-based aggregator: mnotify.com).
// Configured either via env vars or the admin Settings page.
// Docs: https://readthedocs.mnotify.com/

import type { SmsProvider, SmsMessage, SendResult } from "../types";

export function createMnotifySmsProvider(config: { apiKey: string; senderId: string }): SmsProvider {
  return {
    name: "mnotify",
    async send(message: SmsMessage): Promise<SendResult> {
      try {
        const params = new URLSearchParams({
          key: config.apiKey,
          sender: config.senderId || "CSEAG",
          recipient: message.to,
          message: message.body,
        });
        const res = await fetch(`https://apps.mnotify.net/smsapi?${params.toString()}`);
        const text = await res.text();
        if (!res.ok) {
          return { ok: false, error: text };
        }
        return { ok: true, providerMessageId: text };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  };
}
