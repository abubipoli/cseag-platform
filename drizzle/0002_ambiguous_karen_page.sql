ALTER TABLE "member_profiles" ADD COLUMN "csa_accredited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "csa_accreditation_tier" text;