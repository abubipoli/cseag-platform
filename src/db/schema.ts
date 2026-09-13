// Drizzle ORM schema for the CSEAG Website & Member Management System.
// Mirrors the data model in Section 8 of the System Requirements Specification.
//
// Targets Postgres (see src/db/client.ts) — required for Vercel's serverless
// runtime, which has no persistent local filesystem for SQLite.

import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { CSA_ACCREDITATION_TIERS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Roles (Section 4 of the SRS)
// ---------------------------------------------------------------------------
export const ROLES = [
  "applicant", // limited-access account, tier 1 of the tiered workflow
  "member", // approved, active member
  "reviewer", // membership committee
  "admin", // administrator
  "super_admin", // system owner
] as const;
export type Role = (typeof ROLES)[number];

export const APPLICATION_STATUSES = [
  "pending", // awaiting committee review
  "more_info_requested",
  "approved",
  "rejected",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const MEMBERSHIP_CATEGORIES = [
  "student",
  "associate",
  "full_professional",
  "corporate",
] as const;
export type MembershipCategory = (typeof MEMBERSHIP_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Users: authentication + role. One row per login-capable account.
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull().default("applicant"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaSecret: text("mfa_secret"), // base32 TOTP secret; set on setup, kept even if mfaEnabled is still false until confirmed
  mfaBackupCodes: text("mfa_backup_codes"), // JSON-encoded [{ hash, usedAt }] — one-time recovery codes, hashed like passwordResetTokenHash
  isActive: boolean("is_active").notNull().default(true),
  // Set true whenever a temporary/shared password is issued on the user's
  // behalf (bulk credential resets, admin-triggered resets) — checked at
  // login to force a change before the account can be used further.
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: text("last_login_at"),
  passwordResetTokenHash: text("password_reset_token_hash"),
  passwordResetExpiresAt: text("password_reset_expires_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Member profile: one-to-one with users. Holds every field that could ever
// be shown publicly, plus a matching *_visibility flag for each sensitive
// or optional field (Section 6.6 — public profile visibility controls).
// ---------------------------------------------------------------------------
export const memberProfiles = pgTable("member_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),

  title: text("title"), // salutation: Mr./Mrs./Dr/etc — mirrors the membership application form
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth"), // never eligible for public display
  nationalIdNumber: text("national_id_number"), // never eligible for public display
  gender: text("gender"),
  ageGroup: text("age_group"),
  phone: text("phone").notNull(),
  physicalAddress: text("physical_address"), // never eligible for public display
  region: text("region"),

  employer: text("employer"),
  currentRole: text("current_role"),
  yearsOfExperience: integer("years_of_experience"),
  highestCertificate: text("highest_certificate"), // general academic qualification, e.g. "BSc Computer Science"
  certifications: text("certifications"), // JSON-encoded string array — cybersecurity certifications
  csaAccredited: boolean("csa_accredited").notNull().default(false),
  csaAccreditationTier: text("csa_accreditation_tier", { enum: CSA_ACCREDITATION_TIERS }),
  areasOfExpertise: text("areas_of_expertise"), // JSON-encoded string array
  bio: text("bio"),
  photoUrl: text("photo_url"),

  membershipCategory: text("membership_category", { enum: MEMBERSHIP_CATEGORIES }),

  // Visibility flags: true = shown on the public Experts directory.
  // Sensitive fields (DOB, national ID, physical address) intentionally have
  // no visibility flag — they are never eligible for public display at all,
  // per Section 6.6 of the SRS.
  bioIsPublic: boolean("bio_is_public").notNull().default(false),
  yearsOfExperienceIsPublic: boolean("years_experience_is_public").notNull().default(false),
  areasOfExpertiseIsPublic: boolean("areas_of_expertise_is_public").notNull().default(false),
  employerRoleIsPublic: boolean("employer_role_is_public").notNull().default(false),
  certificationsIsPublic: boolean("certifications_is_public").notNull().default(false),
  photoIsPublic: boolean("photo_is_public").notNull().default(false),
  allowPublicContact: boolean("allow_public_contact").notNull().default(false),

  // A member only appears in the directory at all once they are approved
  // AND have confirmed their visibility choices at least once.
  isListedInDirectory: boolean("is_listed_in_directory").notNull().default(false),

  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Applications: the record of a membership application moving through the
// tiered review workflow (Section 6.4).
// ---------------------------------------------------------------------------
export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  status: text("status", { enum: APPLICATION_STATUSES }).notNull().default("pending"),
  statementOfInterest: text("statement_of_interest"),
  supportingDocumentUrl: text("supporting_document_url"),
  codeOfConductAccepted: boolean("code_of_conduct_accepted").notNull().default(false),
  privacyConsentAccepted: boolean("privacy_consent_accepted").notNull().default(false),
  reviewerId: text("reviewer_id"),
  reviewerNotes: text("reviewer_notes"),
  decisionAt: text("decision_at"),
  submittedAt: text("submitted_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Notification log (Section 6.3 / 6.10): every email/SMS the system sends.
// ---------------------------------------------------------------------------
export const NOTIFICATION_CHANNELS = ["email", "sms"] as const;
export const NOTIFICATION_STATUSES = ["sent", "failed", "queued"] as const;

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  channel: text("channel", { enum: NOTIFICATION_CHANNELS }).notNull(),
  templateKey: text("template_key").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status", { enum: NOTIFICATION_STATUSES }).notNull().default("queued"),
  errorMessage: text("error_message"),
  payload: text("payload"), // JSON-encoded template data, so a failed send can be retried later
  sentAt: text("sent_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Content items: news, events, resources, static pages (Section 6.9).
// ---------------------------------------------------------------------------
export const CONTENT_TYPES = ["news", "event", "resource", "page"] as const;
export const CONTENT_STATUSES = ["draft", "published"] as const;

export const contentItems = pgTable("content_items", {
  id: text("id").primaryKey(),
  type: text("type", { enum: CONTENT_TYPES }).notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  fileUrl: text("file_url"), // downloadable attachment, used by type = "resource"
  authorId: text("author_id"),
  status: text("status", { enum: CONTENT_STATUSES }).notNull().default("draft"),
  eventDate: text("event_date"), // only used when type = "event"
  eventLocation: text("event_location"),
  isMemberOnly: boolean("is_member_only").notNull().default(false),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Event RSVPs (Section 6.9 — sign-up/RSVP capture for training/events).
// ---------------------------------------------------------------------------
export const eventRsvps = pgTable("event_rsvps", {
  id: text("id").primaryKey(),
  contentItemId: text("content_item_id").notNull(),
  userId: text("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Newsletter subscribers (Section 6.10 — "Stay Updated" signup).
// ---------------------------------------------------------------------------
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: text("subscribed_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Service requests (Section 6.8 — "contact this expert"). CSEAG's real
// process: a visitor's request is never emailed straight to the expert
// (whose contact details are internal-only); it lands in an admin inbox
// first, and an admin reaches out to the expert to action it. This also
// means a request can be raised for any listed expert regardless of
// whether their own email/phone is on file yet.
// ---------------------------------------------------------------------------
export const SERVICE_REQUEST_STATUSES = ["new", "contacted", "in_progress", "resolved", "declined"] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const serviceRequests = pgTable("service_requests", {
  id: text("id").primaryKey(),
  // The expert the visitor originally asked for — immutable, kept for
  // context even after reassignment.
  expertUserId: text("expert_user_id").notNull(),
  // The expert actually working the ticket. Starts null; an admin assigns
  // it (defaulting to expertUserId) and can reassign it to someone else if
  // the original expert is unavailable.
  assignedExpertUserId: text("assigned_expert_user_id"),
  assignedAt: text("assigned_at"),
  // Random token mailed to the requester (who has no account) so they can
  // open the shared chat thread without logging in.
  accessToken: text("access_token").unique(),
  requesterName: text("requester_name").notNull(),
  requesterEmail: text("requester_email").notNull(),
  requesterPhone: text("requester_phone"),
  message: text("message").notNull(),
  status: text("status", { enum: SERVICE_REQUEST_STATUSES }).notNull().default("new"),
  adminNotes: text("admin_notes"),
  handledBy: text("handled_by"),
  expertNotifiedAt: text("expert_notified_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Service request messages — the monitored chat thread between the assigned
// expert and the requester once a ticket is assigned. Admins can always read
// the full thread for quality oversight.
// ---------------------------------------------------------------------------
export const MESSAGE_SENDER_ROLES = ["expert", "requester", "admin"] as const;
export type MessageSenderRole = (typeof MESSAGE_SENDER_ROLES)[number];

export const serviceRequestMessages = pgTable("service_request_messages", {
  id: text("id").primaryKey(),
  serviceRequestId: text("service_request_id").notNull(),
  senderRole: text("sender_role", { enum: MESSAGE_SENDER_ROLES }).notNull(),
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Audit log: every admin action (Section 6.7 / 7.1 security requirement).
// ---------------------------------------------------------------------------
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  details: text("details"), // JSON-encoded string
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// App settings: a single row holding admin-configurable email/SMS provider
// credentials, so they can be set from the UI instead of redeploying with
// new environment variables. Env vars remain the fallback when a field here
// is empty (see src/lib/settings.ts).
// ---------------------------------------------------------------------------
export const SMS_PROVIDERS = ["", "arkesel", "mnotify", "kairos"] as const;

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(), // always "singleton"
  smtpHost: text("smtp_host"),
  smtpPort: text("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  smtpFrom: text("smtp_from"),
  smsProvider: text("sms_provider", { enum: SMS_PROVIDERS }),
  smsApiSecret: text("sms_api_secret"), // Kairos Africa needs a key AND a secret
  smsApiKey: text("sms_api_key"),
  smsSenderId: text("sms_sender_id"),
  // Membership dues (a single fixed annual amount for now) + Paystack keys,
  // so online payment can be turned on from the UI without a redeploy.
  duesAmountGhs: integer("dues_amount_ghs"),
  paystackPublicKey: text("paystack_public_key"),
  paystackSecretKey: text("paystack_secret_key"),
  // JSON-encoded RolePermissions (see src/lib/permissions.ts) — what the
  // "reviewer" and "admin" roles are each allowed to do in the admin back
  // office. super_admin is always fully permitted and never stored here, so
  // whoever configures this can never lock themselves out.
  rolePermissions: text("role_permissions"),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Notification templates: admin-editable overrides for the wording in
// src/lib/notifications/templates.ts. A missing row (or a blank field within
// one) falls back to that file's hardcoded default — see
// src/lib/notifications/store.ts.
// ---------------------------------------------------------------------------
export const notificationTemplates = pgTable("notification_templates", {
  templateKey: text("template_key").primaryKey(),
  emailSubject: text("email_subject"),
  emailBody: text("email_body"), // plain text with {{placeholders}}; blank lines become paragraph breaks
  smsBody: text("sms_body"), // kept deliberately separate from the email body — SMS should stay short
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Dues payments: one row per payment (a member can pay in instalments, so a
// year's dues may be covered by more than one row). Not enforced anywhere
// yet — members can see their status and optionally pay.
// ---------------------------------------------------------------------------
export const DUES_PAYMENT_METHODS = ["paystack", "manual"] as const;
export type DuesPaymentMethod = (typeof DUES_PAYMENT_METHODS)[number];

export const DUES_PAYMENT_STATUSES = ["pending", "success", "failed"] as const;
export type DuesPaymentStatus = (typeof DUES_PAYMENT_STATUSES)[number];

export const duesPayments = pgTable("dues_payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  year: text("year").notNull(), // dues period this payment counts toward, e.g. "2026"
  amountGhs: integer("amount_ghs").notNull(),
  method: text("method", { enum: DUES_PAYMENT_METHODS }).notNull().default("paystack"),
  status: text("status", { enum: DUES_PAYMENT_STATUSES }).notNull().default("pending"),
  paystackReference: text("paystack_reference").unique(),
  recordedBy: text("recorded_by"), // admin userId, set only for method = "manual"
  note: text("note"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Public donations: separate from member dues on purpose. Dues are tied to
// a member's account and their annual obligation; a donation is a one-off
// gift from anyone — no account or login required — so it gets its own
// table, its own Paystack reference prefix ("donation_"), and its own
// reconciliation path (see src/lib/donations.ts) rather than being folded
// into duesPayments.
// ---------------------------------------------------------------------------
export const DONATION_STATUSES = ["pending", "success", "failed"] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const donations = pgTable("donations", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  amountGhs: integer("amount_ghs").notNull(),
  status: text("status", { enum: DONATION_STATUSES }).notNull().default("pending"),
  paystackReference: text("paystack_reference").unique(),
  message: text("message"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
