CREATE TABLE "site_visits" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"user_id" text,
	"ip" text,
	"country" text,
	"city" text,
	"referrer" text,
	"user_agent" text,
	"created_at" text NOT NULL
);
