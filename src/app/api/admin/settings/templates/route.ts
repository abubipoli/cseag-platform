// GET /api/admin/settings/templates — every customizable notification
// template's current effective wording (an override if one exists, else the
// hardcoded default), plus the {{placeholders}} available to each, for the
// Settings > Notification templates editor.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getTemplateOverride } from "@/lib/notifications/store";
import { renderTemplate, TEMPLATE_LABELS, TEMPLATE_VARIABLES, type TemplateKey } from "@/lib/notifications/templates";

const SAMPLE_DATA: Record<string, string> = {
  name: "Sample Name",
  reason: "",
  request: "",
  resetUrl: "https://cyberexpertgh.org/reset-password?token=...",
  tempPassword: "Ab3xY9kLp",
  role: "member",
  email: "member@example.com",
  fromName: "Jane Doe",
  fromEmail: "jane@example.com",
  fromPhone: "+233241234567",
  subject: "Example subject",
  message: "Example message",
  expertName: "Expert Name",
  dashboardUrl: "https://cyberexpertgh.org/dashboard",
  chatUrl: "https://cyberexpertgh.org/service-requests/abc123",
  eventTitle: "Annual Cybersecurity Summit",
  eventDate: "12 Dec 2026",
  eventLocation: "Accra",
};

export async function GET() {
  const session = await getSession();
  if (!session || !(await hasPermission(session, "settings"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys = Object.keys(TEMPLATE_LABELS) as (keyof typeof TEMPLATE_LABELS)[];
  const templates = await Promise.all(
    keys.map(async (key) => {
      const override = await getTemplateOverride(key as TemplateKey);
      const fallback = renderTemplate(key as TemplateKey, SAMPLE_DATA);
      return {
        key,
        label: TEMPLATE_LABELS[key],
        variables: TEMPLATE_VARIABLES[key],
        isCustomized: !!(override?.emailSubject || override?.emailBody || override?.smsBody),
        emailSubject: override?.emailSubject || fallback.emailSubject,
        emailBody: override?.emailBody || fallback.emailText,
        smsBody: override?.smsBody || fallback.sms,
      };
    })
  );

  return NextResponse.json({ templates });
}
