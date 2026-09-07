// mNotify SMS provider (Ghana-based aggregator: mnotify.com).
// Configure via env vars: SMS_API_KEY, SMS_SENDER_ID (max 11 chars, e.g. "CSEAG").
// Docs: https://readthedocs.mnotify.com/

import type { SmsProvider, SmsMessage, SendResult } from "../types";

export function createMnotifySmsProvider(): SmsProvider {
  return {
    name: "mnotify",
    async send(message: SmsMessage): Promise<SendResult> {
      try {
        const params = new URLSearchParams({
          key: process.env.SMS_API_KEY || "",
          sender: process.env.SMS_SENDER_ID || "CSEAG",
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
