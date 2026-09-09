// Admin-editable overrides for notification wording (Section 6.3 — customizable
// applicant/approval email & SMS text). A template with no override row, or a
// blank field within one, falls back to the hardcoded default in
// templates.ts — so nothing breaks before an admin has customized anything.

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { notificationTemplates } from "@/db/schema";
import { renderTemplate, type Rendered, type TemplateKey } from "./templates";

export interface TemplateOverride {
  emailSubject: string | null;
  emailBody: string | null;
  smsBody: string | null;
}

export async function getTemplateOverride(key: TemplateKey): Promise<TemplateOverride | null> {
  const row = await db.query.notificationTemplates.findFirst({ where: eq(notificationTemplates.templateKey, key) });
  if (!row) return null;
  return { emailSubject: row.emailSubject, emailBody: row.emailBody, smsBody: row.smsBody };
}

export async function setTemplateOverride(key: TemplateKey, input: TemplateOverride) {
  const existing = await db.query.notificationTemplates.findFirst({ where: eq(notificationTemplates.templateKey, key) });
  const update = { ...input, updatedAt: new Date().toISOString() };
  if (existing) {
    await db.update(notificationTemplates).set(update).where(eq(notificationTemplates.templateKey, key));
  } else {
    await db.insert(notificationTemplates).values({ templateKey: key, ...update });
  }
}

function substitute(str: string, vars: Record<string, string>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/** Resolves a template's final content: DB override (if any field is set) over the hardcoded default. */
export async function resolveTemplate(key: TemplateKey, data: Record<string, string>): Promise<Rendered> {
  const fallback = renderTemplate(key, data);
  if (key === "custom") return fallback;

  const override = await getTemplateOverride(key);
  if (!override) return fallback;

  const vars = { ...data, name: data.name || "there" };
  const emailBody = override.emailBody?.trim() ? substitute(override.emailBody, vars) : null;

  return {
    emailSubject: override.emailSubject?.trim() ? substitute(override.emailSubject, vars) : fallback.emailSubject,
    emailText: emailBody ?? fallback.emailText,
    emailHtml: emailBody ? textToHtml(emailBody) : fallback.emailHtml,
    sms: override.smsBody?.trim() ? substitute(override.smsBody, vars) : fallback.sms,
  };
}
