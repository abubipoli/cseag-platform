ALTER TABLE "member_profiles" ADD COLUMN "membership_id" text;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_membership_id_unique" UNIQUE("membership_id");