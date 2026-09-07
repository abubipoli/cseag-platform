// Drizzle ORM schema for the CSEAG Website & Member Management System.
// Mirrors the data model in Section 8 of the System Requirements Specification.
//
// This schema targets SQLite for local development (see src/db/client.ts).
// The column types used here (text, integer) are intentionally kept
// Postgres-compatible so migrating the datasource later is a config change,
// not a schema rewrite.

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull().default("applicant"),
  mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).notNull().default(false),
  mfaSecret: text("mfa_secret"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// ---------------------------------------------------------------------------
// Member profile: one-to-one with users. Holds every field that could ever
// be shown publicly, plus a matching *_visibility flag for each sensitive
// or optional field (Section 6.6 — public profile visibility controls).
// ---------------------------------------------------------------------------
export const memberProfiles = sqliteTable("member_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),

  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth"), // never eligible for public display
  nationalIdNumber: text("national_id_number"), // never eligible for public display
  gender: text("gender"),
  phone: text("phone").notNull(),
  physicalAddress: text("physical_address"), // never eligible for public display
  region: text("region"),

  employer: text("employer"),
  currentRole: text("current_role"),
  yearsOfExperience: integer("years_of_experience"),
  certifications: text("certifications"), // JSON-encoded string array
  areasOfExpertise: text("areas_of_expertise"), // JSON-encoded string array
  bio: text("bio"),
  photoUrl: text("photo_url"),

  membershipCategory: text("membership_category", { enum: MEMBERSHIP_CATEGORIES }),

  // Visibility flags: true = shown on the public Experts directory.
  // Sensitive fields (DOB, national ID, physical address) intentionally have
  // no visibility flag — they are never eligible for public display at all,
  // per Section 6.6 of the SRS.
  bioIsPublic: integer("bio_is_public", { mode: "boolean" }).notNull().default(false),
  yearsOfExperienceIsPublic: integer("years_experience_is_public", { mode: "boolean" }).notNull().default(false),
  areasOfExpertiseIsPublic: integer("areas_of_expertise_is_public", { mode: "boolean" }).notNull().default(false),
  employerRoleIsPublic: integer("employer_role_is_public", { mode: "boolean" }).notNull().default(false),
  certificationsIsPublic: integer("certifications_is_public", { mode: "boolean" }).notNull().default(false),
  photoIsPublic: integer("photo_is_public", { mode: "boolean" }).notNull().default(false),
  allowPublicContact: integer("allow_public_contact", { mode: "boolean" }).notNull().default(false),

  // A member only appears in the directory at all once they are approved
  // AND have confirmed their visibility choices at least once.
  isListedInDirectory: integer("is_listed_in_directory", { mode: "boolean" }).notNull().default(false),

  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// ---------------------------------------------------------------------------
// Applications: the record of a membership application moving through the
// tiered review workflow (Section 6.4).
// ---------------------------------------------------------------------------
export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  status: text("status", { enum: APPLICATION_STATUSES }).notNull().default("pending"),
  statementOfInterest: text("statement_of_interest"),
  supportingDocumentUrl: text("supporting_document_url"),
  codeOfConductAccepted: integer("code_of_conduct_accepted", { mode: "boolean" }).notNull().default(false),
  privacyConsentAccepted: integer("privacy_consent_accepted", { mode: "boolean" }).notNull().default(false),
  reviewerId: text("reviewer_id"),
  reviewerNotes: text("reviewer_notes"),
  decisionAt: text("decision_at"),
  submittedAt: text("submitted_at").notNull().default(sql`(current_timestamp)`),
});

// ---------------------------------------------------------------------------
// Notification log (Section 6.3 / 6.10): every email/SMS the system sends.
// ---------------------------------------------------------------------------
export const NOTIFICATION_CHANNELS = ["email", "sms"] as const;
export const NOTIFICATION_STATUSES = ["sent", "failed", "queued"] as const;

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  channel: text("channel", { enum: NOTIFICATION_CHANNELS }).notNull(),
  templateKey: text("template_key").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status", { enum: NOTIFICATION_STATUSES }).notNull().default("queued"),
  errorMessage: text("error_message"),
  sentAt: text("sent_at").notNull().default(sql`(current_timestamp)`),
});

// ---------------------------------------------------------------------------
// Content items: news, events, resources, static pages (Section 6.9).
// ---------------------------------------------------------------------------
export const CONTENT_TYPES = ["news", "event", "resource", "page"] as const;
export const CONTENT_STATUSES = ["draft", "published"] as const;

export const contentItems = sqliteTable("content_items", {
  id: text("id").primaryKey(),
  type: text("type", { enum: CONTENT_TYPES }).notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorId: text("author_id"),
  status: text("status", { enum: CONTENT_STATUSES }).notNull().default("draft"),
  eventDate: text("event_date"), // only used when type = "event"
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// ---------------------------------------------------------------------------
// Audit log: every admin action (Section 6.7 / 7.1 security requirement).
// ---------------------------------------------------------------------------
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  details: text("details"), // JSON-encoded string
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});
