ALTER TABLE "app_settings" ADD COLUMN "dues_full_professional_ghs" integer;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "dues_associate_ghs" integer;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "dues_student_ghs" integer;--> statement-breakpoint
UPDATE "app_settings" SET "dues_full_professional_ghs" = 500, "dues_associate_ghs" = 300, "dues_student_ghs" = 150;
