CREATE TABLE "dues_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"year" text NOT NULL,
	"amount_ghs" integer NOT NULL,
	"method" text DEFAULT 'paystack' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paystack_reference" text,
	"recorded_by" text,
	"note" text,
	"created_at" text NOT NULL,
	CONSTRAINT "dues_payments_paystack_reference_unique" UNIQUE("paystack_reference")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"template_key" text PRIMARY KEY NOT NULL,
	"email_subject" text,
	"email_body" text,
	"sms_body" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "dues_amount_ghs" integer;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "paystack_public_key" text;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "paystack_secret_key" text;