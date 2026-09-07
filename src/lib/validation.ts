import { z } from "zod";
import { MEMBERSHIP_CATEGORIES } from "@/db/schema";

export const registrationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .min(9, "Enter a valid phone number")
    .regex(/^\+?[0-9\s-]{9,15}$/, "Enter a valid phone number, e.g. +233241234567"),
  region: z.string().optional(),
  employer: z.string().optional(),
  currentRole: z.string().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  areasOfExpertise: z.array(z.string()).min(1, "Select at least one area of expertise"),
  certifications: z.array(z.string()).optional().default([]),
  membershipCategory: z.enum(MEMBERSHIP_CATEGORIES),
  bio: z.string().max(3000).optional(),
  statementOfInterest: z.string().max(2000).optional(),
  codeOfConductAccepted: z.literal(true, { message: "You must accept the Code of Conduct" }),
  privacyConsentAccepted: z.literal(true, { message: "You must accept the privacy notice" }),
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
  fullName: z.string().min(2).optional(),
  phone: z.string().min(9).optional(),
  region: z.string().optional(),
  employer: z.string().optional(),
  currentRole: z.string().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  areasOfExpertise: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
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
