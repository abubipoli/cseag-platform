// Notification templates (SRS Section 6.3 — admin-editable wording).
// For now these live in code; a future enhancement can move them into the
// content_items table so admins can edit wording without a developer,
// exactly as the SRS specifies. Keeping them centralized here already gets
// most of the value: one place to change the wording for every applicant.

export type TemplateKey =
  | "application_received"
  | "application_approved"
  | "application_rejected"
  | "application_more_info"
  | "password_reset"
  | "password_reset_by_admin"
  | "account_created_by_admin"
  | "contact_form_relay"
  | "service_request_received_admin"
  | "service_request_assigned_expert"
  | "service_request_chat_link_requester"
  | "service_request_new_message"
  | "newsletter_confirmation"
  | "event_rsvp_confirmation"
  | "custom";

export interface Rendered {
  emailSubject: string;
  emailHtml: string;
  emailText: string;
  sms: string;
}

// Human-readable labels + the {{placeholder}} variables available to an
// admin customizing this template's wording in Settings (src/app/admin/settings/templates).
export const TEMPLATE_LABELS: Record<Exclude<TemplateKey, "custom">, string> = {
  application_received: "Application submitted (to applicant)",
  application_approved: "Application approved",
  application_rejected: "Application rejected",
  application_more_info: "More information requested",
  password_reset: "Password reset (self-service)",
  password_reset_by_admin: "Password reset (by admin)",
  account_created_by_admin: "Account created by admin",
  contact_form_relay: "Contact form message (to admin)",
  service_request_received_admin: "New service request (to admin)",
  service_request_assigned_expert: "Service request assigned (to expert)",
  service_request_chat_link_requester: "Expert assigned (to requester)",
  service_request_new_message: "New chat message",
  newsletter_confirmation: "Newsletter subscription confirmation",
  event_rsvp_confirmation: "Event RSVP confirmation",
};

export const TEMPLATE_VARIABLES: Record<Exclude<TemplateKey, "custom">, string[]> = {
  application_received: ["name"],
  application_approved: ["name"],
  application_rejected: ["name", "reason"],
  application_more_info: ["name", "request"],
  password_reset: ["name", "resetUrl"],
  password_reset_by_admin: ["name", "tempPassword"],
  account_created_by_admin: ["name", "role", "email", "tempPassword"],
  contact_form_relay: ["fromName", "fromEmail", "subject", "message"],
  service_request_received_admin: ["expertName", "fromName", "fromEmail", "fromPhone", "message"],
  service_request_assigned_expert: ["name", "fromName", "fromEmail", "fromPhone", "message", "dashboardUrl"],
  service_request_chat_link_requester: ["name", "expertName", "chatUrl"],
  service_request_new_message: ["name", "fromName", "message", "chatUrl"],
  newsletter_confirmation: [],
  event_rsvp_confirmation: ["name", "eventTitle", "eventDate", "eventLocation"],
};

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

    case "password_reset":
      return {
        emailSubject: "Reset your CSEAG password",
        emailText: `Hi ${name},\n\nWe received a request to reset your CSEAG account password. This link expires in 1 hour:\n\n${data.resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>We received a request to reset your CSEAG account password. This link expires in 1 hour:</p><p><a href="${data.resetUrl}">${data.resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p><p>— CSEAG</p>`,
        sms: `CSEAG: A password reset was requested for your account. Check your email for the reset link (expires in 1 hour). Ignore if this wasn't you.`,
      };

    case "password_reset_by_admin":
      return {
        emailSubject: "Your CSEAG account password has been reset",
        emailText: `Hi ${name},\n\nA CSEAG administrator has reset your account password. Your temporary password is:\n\n${data.tempPassword}\n\nPlease log in and change it as soon as possible.\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>A CSEAG administrator has reset your account password. Your temporary password is:</p><p><strong>${data.tempPassword}</strong></p><p>Please log in and change it as soon as possible.</p><p>— CSEAG</p>`,
        sms: `CSEAG: Your account password was reset by an administrator. Temporary password: ${data.tempPassword}. Please log in and change it.`,
      };

    case "account_created_by_admin":
      return {
        emailSubject: "An account has been created for you on the CSEAG platform",
        emailText: `Hi ${name},\n\nA CSEAG administrator has created a ${data.role} account for you.\n\nEmail: ${data.email}\nTemporary password: ${data.tempPassword}\n\nPlease log in and change your password as soon as possible.\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>A CSEAG administrator has created a <strong>${data.role}</strong> account for you.</p><p>Email: ${data.email}<br/>Temporary password: <strong>${data.tempPassword}</strong></p><p>Please log in and change your password as soon as possible.</p><p>— CSEAG</p>`,
        sms: `CSEAG: An account was created for you (${data.role}). Email: ${data.email}. Temporary password: ${data.tempPassword}. Please log in and change it.`,
      };

    case "contact_form_relay":
      return {
        emailSubject: `New contact form message: ${data.subject}`,
        emailText: `From: ${data.fromName} <${data.fromEmail}>\n\n${data.message}`,
        emailHtml: `<p><strong>From:</strong> ${data.fromName} &lt;${data.fromEmail}&gt;</p><p>${data.message}</p>`,
        sms: `CSEAG website: new message from ${data.fromName} — check your inbox.`,
      };

    case "service_request_received_admin":
      return {
        emailSubject: `New service request for ${data.expertName}`,
        emailText: `A new service request came in via the public Expert Directory.\n\nRequested expert: ${data.expertName}\nFrom: ${data.fromName} (${data.fromEmail}${data.fromPhone ? `, ${data.fromPhone}` : ""})\n\nMessage:\n"${data.message}"\n\nReview and action it from /admin/service-requests.`,
        emailHtml: `<p>A new service request came in via the public Expert Directory.</p><p><strong>Requested expert:</strong> ${data.expertName}<br/><strong>From:</strong> ${data.fromName} (${data.fromEmail}${data.fromPhone ? `, ${data.fromPhone}` : ""})</p><p><strong>Message:</strong><br/>"${data.message}"</p><p>Review and action it from <code>/admin/service-requests</code>.</p>`,
        sms: `CSEAG: New service request for ${data.expertName} from ${data.fromName}. Check /admin/service-requests.`,
      };

    case "service_request_assigned_expert":
      return {
        emailSubject: `You've been assigned a service request via CSEAG`,
        emailText: `Hi ${name},\n\nAn admin has assigned you a service request from the CSEAG Expert Directory.\n\nFrom: ${data.fromName} (${data.fromEmail}${data.fromPhone ? `, ${data.fromPhone}` : ""})\n\nWhat they need:\n"${data.message}"\n\nLog in to your dashboard's "My Requests" tab to message them directly:\n${data.dashboardUrl}\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>An admin has assigned you a service request from the CSEAG Expert Directory.</p><p><strong>From:</strong> ${data.fromName} (${data.fromEmail}${data.fromPhone ? `, ${data.fromPhone}` : ""})</p><p><strong>What they need:</strong><br/>"${data.message}"</p><p>Log in to your dashboard's "My Requests" tab to message them directly: <a href="${data.dashboardUrl}">${data.dashboardUrl}</a></p><p>— CSEAG</p>`,
        sms: `CSEAG: You've been assigned a service request from ${data.fromName}. Log in to your dashboard's My Requests tab to respond.`,
      };

    case "service_request_chat_link_requester":
      return {
        emailSubject: `${data.expertName} has been assigned to your CSEAG request`,
        emailText: `Hi ${name},\n\n${data.expertName} has been assigned to your request and can now message you directly.\n\nOpen your conversation here (no login needed):\n${data.chatUrl}\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>${data.expertName} has been assigned to your request and can now message you directly.</p><p>Open your conversation here (no login needed): <a href="${data.chatUrl}">${data.chatUrl}</a></p><p>— CSEAG</p>`,
        sms: `CSEAG: ${data.expertName} has been assigned to your request. Chat here: ${data.chatUrl}`,
      };

    case "service_request_new_message":
      return {
        emailSubject: `New message from ${data.fromName}`,
        emailText: `Hi ${name},\n\n${data.fromName} sent you a new message:\n\n"${data.message}"\n\nReply here:\n${data.chatUrl}\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>${data.fromName} sent you a new message:</p><p>"${data.message}"</p><p><a href="${data.chatUrl}">Reply here</a></p><p>— CSEAG</p>`,
        sms: `CSEAG: New message from ${data.fromName}. Check your email to reply.`,
      };

    case "newsletter_confirmation":
      return {
        emailSubject: "You're subscribed to CSEAG updates",
        emailText: `Hi there,\n\nThanks for subscribing to CSEAG news and updates. We'll keep you posted on training, events, and association news.\n\n— CSEAG`,
        emailHtml: `<p>Hi there,</p><p>Thanks for subscribing to CSEAG news and updates. We'll keep you posted on training, events, and association news.</p><p>— CSEAG</p>`,
        sms: `CSEAG: You're subscribed to our updates. Thanks for joining!`,
      };

    case "event_rsvp_confirmation":
      return {
        emailSubject: `You're registered: ${data.eventTitle}`,
        emailText: `Hi ${name},\n\nYou're confirmed for "${data.eventTitle}"${data.eventDate ? ` on ${data.eventDate}` : ""}${
          data.eventLocation ? ` at ${data.eventLocation}` : ""
        }.\n\nSee you there!\n\n— CSEAG`,
        emailHtml: `<p>Hi ${name},</p><p>You're confirmed for <strong>${data.eventTitle}</strong>${data.eventDate ? ` on ${data.eventDate}` : ""}${
          data.eventLocation ? ` at ${data.eventLocation}` : ""
        }.</p><p>See you there!</p><p>— CSEAG</p>`,
        sms: `CSEAG: You're registered for "${data.eventTitle}". See you there!`,
      };

    case "custom":
      return {
        emailSubject: data.subject || "A message from CSEAG",
        emailText: data.message || "",
        emailHtml: `<p>${(data.message || "").replace(/\n/g, "<br/>")}</p>`,
        sms: (data.message || "").slice(0, 300),
      };
  }
}
