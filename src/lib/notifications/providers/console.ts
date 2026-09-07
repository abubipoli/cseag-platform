// Fallback providers used automatically when no real provider is configured
// (no SMTP_HOST / no SMS_API_KEY in the environment). They log to the server
// console instead of failing, so the registration flow is fully testable
// end-to-end before real vendor credentials exist.

import type { EmailProvider, SmsProvider, EmailMessage, SmsMessage, SendResult } from "../types";

export const consoleEmailProvider: EmailProvider = {
  name: "console (dev fallback)",
  async send(message: EmailMessage): Promise<SendResult> {
    console.log("\n--- [DEV] Email not sent (no email provider configured) ---");
    console.log("To:", message.to);
    console.log("Subject:", message.subject);
    console.log(message.text);
    console.log("--- end email ---\n");
    return { ok: true, providerMessageId: "console-dev" };
  },
};

export const consoleSmsProvider: SmsProvider = {
  name: "console (dev fallback)",
  async send(message: SmsMessage): Promise<SendResult> {
    console.log("\n--- [DEV] SMS not sent (no SMS provider configured) ---");
    console.log("To:", message.to);
    console.log(message.body);
    console.log("--- end SMS ---\n");
    return { ok: true, providerMessageId: "console-dev" };
  },
};
