// Notification templates (SRS Section 6.3 — admin-editable wording).
// For now these live in code; a future enhancement can move them into the
// content_items table so admins can edit wording without a developer,
// exactly as the SRS specifies. Keeping them centralized here already gets
// most of the value: one place to change the wording for every applicant.

export type TemplateKey =
  | "application_received"
  | "application_approved"
  | "application_rejected"
  | "application_more_info";

interface Rendered {
  emailSubject: string;
  emailHtml: string;
  emailText: string;
  sms: string;
}

export function renderTemplate(key: TemplateKey, data: Record<string, string>): Rendered {
  const name = data.name || "there";

  switch (key) {
    case "application_received":
      return {
        emailSubject: "CSEAG — We've received your membership application",
        emailText: `Hi ${name},\n\nThank you for applying to the Cyber Security Experts Association of Ghana (CSEAG). We have received your application and it is now with our membership committee for review.\n\nYou can log in at any time to check your status.\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>Thank you for applying to the Cyber Security Experts Association of Ghana (CSEAG). We have received your application and it is now with our membership committee for review.</p><p>You can log in at any time to check your status.</p><p>— CSEAG</p>`,
        sms: `CSEAG: Hi ${name}, we've received your membership application and it's under review. We'll notify you of the outcome.`,
      };
    case "application_approved":
      return {
        emailSubject: "Welcome to CSEAG — your application has been approved",
        emailText: `Hi ${name},\n\nCongratulations — your CSEAG membership application has been approved. You now have full member access, and can choose which parts of your profile appear in the public Experts directory from your dashboard.\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>Congratulations — your CSEAG membership application has been approved. You now have full member access, and can choose which parts of your profile appear in the public Experts directory from your dashboard.</p><p>— CSEAG</p>`,
        sms: `CSEAG: Congratulations ${name}, your membership application has been approved! Log in to your member dashboard to get started.`,
      };
    case "application_rejected":
      return {
        emailSubject: "CSEAG membership application — update",
        emailText: `Hi ${name},\n\nThank you for your interest in CSEAG. After review, we're unable to approve your application at this time.${
          data.reason ? ` Reason: ${data.reason}` : ""
        }\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>Thank you for your interest in CSEAG. After review, we're unable to approve your application at this time.${
          data.reason ? ` Reason: ${data.reason}` : ""
        }</p><p>— CSEAG</p>`,
        sms: `CSEAG: Hi ${name}, after review we're unable to approve your application at this time. Check your email for details.`,
      };
    case "application_more_info":
      return {
        emailSubject: "CSEAG membership application — more information needed",
        emailText: `Hi ${name},\n\nOur membership committee needs more information to complete your application review:\n\n${
          data.request || ""
        }\n\nPlease log in to your dashboard to respond.\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>Our membership committee needs more information to complete your application review:</p><p>${
          data.request || ""
        }</p><p>Please log in to your dashboard to respond.</p><p>— CSEAG</p>`,
        sms: `CSEAG: Hi ${name}, we need more info to review your application. Please check your email and log in to respond.`,
      };
  }
}
