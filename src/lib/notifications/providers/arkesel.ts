// Arkesel SMS provider (popular Ghana-based SMS aggregator: arkesel.com).
// Configure via env vars: SMS_API_KEY, SMS_SENDER_ID (max 11 chars, e.g. "CSEAG").
// Docs: https://developers.arkesel.com/

import type { SmsProvider, SmsMessage, SendResult } from "../types";

export function createArkeselSmsProvider(): SmsProvider {
  return {
    name: "arkesel",
    async send(message: SmsMessage): Promise<SendResult> {
      try {
        const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
          method: "POST",
          headers: {
            "api-key": process.env.SMS_API_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: process.env.SMS_SENDER_ID || "CSEAG",
            message: message.body,
            recipients: [message.to],
          }),
        });
        const data = await res.json();
        if (!res.ok || data.status !== "success") {
          return { ok: false, error: JSON.stringify(data) };
        }
        return { ok: true, providerMessageId: data?.data?.[0]?.id };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  };
}
