CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"smtp_host" text,
	"smtp_port" text,
	"smtp_user" text,
	"smtp_pass" text,
	"smtp_from" text,
	"sms_provider" text,
	"sms_api_key" text,
	"sms_sender_id" text,
	"updated_at" text NOT NULL
);
