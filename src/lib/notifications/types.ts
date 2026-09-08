// Pluggable notification interfaces (SRS Section 6.3 / 9 — Integrations).
//
// The rest of the app only ever calls sendEmail()/sendSms() from index.ts.
// It never talks to a specific vendor SDK directly. That means swapping in
// your real email/SMS provider later is a change in ONE file
// (src/lib/notifications/index.ts) rather than a change everywhere
// notifications are triggered.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SmsMessage {
  to: string; // E.164 format, e.g. +233241234567
  body: string;
}

export interface SendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<SendResult>;
}

export interface SmsProvider {
  name: string;
  send(message: SmsMessage): Promise<SendResult>;
}
