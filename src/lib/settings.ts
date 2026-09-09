// Reads admin-configurable notification settings from the database,
// falling back to environment variables for any field left unset in the UI
// (see src/app/admin/settings/page.tsx and src/db/schema.ts#appSettings).

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appSettings } from "@/db/schema";

const SETTINGS_ID = "singleton";

export interface NotificationSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smsProvider: string;
  smsApiKey: string;
  smsApiSecret: string;
  smsSenderId: string;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.id, SETTINGS_ID) });

  return {
    smtpHost: row?.smtpHost || process.env.SMTP_HOST || "",
    smtpPort: row?.smtpPort || process.env.SMTP_PORT || "587",
    smtpUser: row?.smtpUser || process.env.SMTP_USER || "",
    smtpPass: row?.smtpPass || process.env.SMTP_PASS || "",
    smtpFrom: row?.smtpFrom || process.env.SMTP_FROM || "",
    smsProvider: row?.smsProvider || process.env.SMS_PROVIDER || "",
    smsApiKey: row?.smsApiKey || process.env.SMS_API_KEY || "",
    smsApiSecret: row?.smsApiSecret || process.env.SMS_API_SECRET || "",
    smsSenderId: row?.smsSenderId || process.env.SMS_SENDER_ID || "CSEAG",
  };
}

export async function updateNotificationSettings(input: Partial<NotificationSettings>) {
  const existing = await db.query.appSettings.findFirst({ where: eq(appSettings.id, SETTINGS_ID) });
  const update = { ...input, updatedAt: new Date().toISOString() } as Partial<typeof appSettings.$inferInsert>;

  if (existing) {
    await db.update(appSettings).set(update).where(eq(appSettings.id, SETTINGS_ID));
  } else {
    await db.insert(appSettings).values({ id: SETTINGS_ID, ...update });
  }
}

export interface PaymentSettings {
  duesAmountGhs: number;
  paystackPublicKey: string;
  paystackSecretKey: string;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.id, SETTINGS_ID) });

  return {
    duesAmountGhs: row?.duesAmountGhs ?? 0,
    paystackPublicKey: row?.paystackPublicKey || "",
    paystackSecretKey: row?.paystackSecretKey || "",
  };
}

export async function updatePaymentSettings(input: Partial<PaymentSettings>) {
  const existing = await db.query.appSettings.findFirst({ where: eq(appSettings.id, SETTINGS_ID) });
  const update = { ...input, updatedAt: new Date().toISOString() } as Partial<typeof appSettings.$inferInsert>;

  if (existing) {
    await db.update(appSettings).set(update).where(eq(appSettings.id, SETTINGS_ID));
  } else {
    await db.insert(appSettings).values({ id: SETTINGS_ID, ...update });
  }
}
