import { z } from "zod";
import {
  MEMBERSHIP_CATEGORIES,
  ROLES,
  CONTENT_TYPES,
  CONTENT_STATUSES,
  SERVICE_REQUEST_STATUSES,
  SMS_PROVIDERS,
} from "@/db/schema";
import { TITLE_OPTIONS, AGE_GROUPS, GHANA_REGIONS, CSA_ACCREDITATION_TIERS } from "@/lib/constants";

// Strong-password policy (SRS 7.1 — account security). Applied everywhere a
// user sets their own password: registration and self-service reset. See
// src/components/ui/PasswordRequirements.tsx for the matching client-side
// checklist, and generateTemporaryPassword() in src/lib/auth.ts for
// admin-issued temporary passwords, which are generated to satisfy this
// same policy.
export const strongPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one symbol (e.g. ! @ # $ %)");

export const registrationSchema = z.object({
  title: z.enum(TITLE_OPTIONS, { message: "Select a title" }),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: strongPasswordSchema,
  phone: z
    .string()
    .min(9, "Enter a valid phone number")
    .regex(/^\+?[0-9\s-]{9,15}$/, "Enter a valid phone number, e.g. +233241234567"),
  ageGroup: z.enum(AGE_GROUPS, { message: "Select an age group" }),
  region: z.enum(GHANA_REGIONS, { message: "Select a region" }),
  employer: z.string().optional(),
  currentRole: z.string().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  highestCertificate: z.string().min(1, "Enter your highest certificate obtained"),
  areasOfExpertise: z.array(z.string()).min(1, "Select at least one area of expertise"),
  certifications: z.array(z.string()).optional().default([]),
  csaAccredited: z.boolean().optional().default(false),
  csaAccreditationTier: z.enum(CSA_ACCREDITATION_TIERS).optional(),
  membershipCategory: z.enum(MEMBERSHIP_CATEGORIES),
  bio: z.string().max(3000).optional(),
  statementOfInterest: z.string().max(2000).optional(),
  supportingDocumentUrl: z.string().optional(),
  codeOfConductAccepted: z.literal(true, { message: "You must accept the Code of Conduct" }),
  privacyConsentAccepted: z.literal(true, { message: "You must accept the privacy notice" }),
  // Honeypot — see contactFormSchema for rationale.
  website: z.string().max(0).optional(),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "more_info_requested"]),
  notes: z.string().max(2000).optional(),
});

export const profileUpdateSchema = z.object({
  title: z.enum(TITLE_OPTIONS).optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().min(9).optional(),
  ageGroup: z.enum(AGE_GROUPS).optional(),
  region: z.enum(GHANA_REGIONS).optional(),
  employer: z.string().optional(),
  currentRole: z.string().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  highestCertificate: z.string().optional(),
  areasOfExpertise: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  csaAccredited: z.boolean().optional(),
  csaAccreditationTier: z.enum(CSA_ACCREDITATION_TIERS).optional(),
  bio: z.string().max(3000).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),

  bioIsPublic: z.boolean().optional(),
  yearsOfExperienceIsPublic: z.boolean().optional(),
  areasOfExpertiseIsPublic: z.boolean().optional(),
  employerRoleIsPublic: z.boolean().optional(),
  certificationsIsPublic: z.boolean().optional(),
  photoIsPublic: z.boolean().optional(),
  allowPublicContact: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: strongPasswordSchema,
});

export const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(4000),
  // Honeypot: real visitors never fill this hidden field. Basic bot
  // resistance without needing a third-party CAPTCHA key (SRS 6.2 / 9).
  website: z.string().max(0).optional(),
});

export const serviceRequestSchema = z.object({
  requesterName: z.string().min(2),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().optional(),
  message: z.string().min(5, "Tell us a little about what you need").max(4000),
  website: z.string().max(0).optional(),
});

export const serviceRequestUpdateSchema = z.object({
  status: z.enum(SERVICE_REQUEST_STATUSES).optional(),
  adminNotes: z.string().max(4000).optional(),
  // Assigns (or reassigns) the ticket to this expert and notifies them by
  // email + SMS, along with emailing the requester their chat link.
  assignExpertUserId: z.string().optional(),
});

export const serviceRequestMessageSchema = z.object({
  message: z.string().min(1, "Write a message").max(4000),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const rsvpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().max(0).optional(),
});

export const adminMemberUpdateSchema = z.object({
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  membershipCategory: z.enum(MEMBERSHIP_CATEGORIES).optional(),
  resetPassword: z.boolean().optional(),
  email: z.string().email("Enter a valid email address").optional(),
});

export const contentItemSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  title: z.string().min(2).max(200),
  summary: z.string().max(500).optional(),
  body: z.string().min(1),
  imageUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  status: z.enum(CONTENT_STATUSES),
  publishedAt: z.string().optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  isMemberOnly: z.boolean().optional(),
});

export const broadcastSchema = z.object({
  audience: z.enum(["all_members", "applicants", "reviewers_admins", "custom"]),
  customUserIds: z.array(z.string()).optional(),
  channel: z.enum(["email", "sms", "both"]),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
});

export const notificationSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().optional(),
  smsProvider: z.enum(SMS_PROVIDERS).optional(),
  smsApiKey: z.string().optional(),
  smsApiSecret: z.string().optional(),
  smsSenderId: z.string().optional(),
});

export const notificationTemplateUpdateSchema = z.object({
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(5000).optional(),
  smsBody: z.string().max(500).optional(),
});

export const paymentSettingsSchema = z.object({
  duesAmountGhs: z.coerce.number().int().min(0).optional(),
  paystackPublicKey: z.string().optional(),
  paystackSecretKey: z.string().optional(),
});

export const manualDuesPaymentSchema = z.object({
  userId: z.string().min(1),
  amountGhs: z.coerce.number().int().min(1),
  note: z.string().max(500).optional(),
});

export const adminCreateUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .min(9, "Enter a valid phone number")
    .regex(/^\+?[0-9\s-]{9,15}$/, "Enter a valid phone number, e.g. +233241234567"),
  role: z.enum(ROLES),
  membershipCategory: z.enum(MEMBERSHIP_CATEGORIES).optional(),
});
