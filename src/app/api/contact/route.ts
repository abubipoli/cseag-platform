// POST /api/contact — general "Contact Us" form, relayed to CSEAG's inbox.
import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import { SITE_CONFIG } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  if (parsed.data.website) {
    // Honeypot tripped — silently pretend success.
    return NextResponse.json({ ok: true });
  }

  await notify({
    templateKey: "contact_form_relay",
    email: SITE_CONFIG.email,
    replyTo: parsed.data.email,
    data: {
      fromName: parsed.data.name,
      fromEmail: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ ok: true });
}
