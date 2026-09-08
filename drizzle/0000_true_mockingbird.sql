CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"statement_of_interest" text,
	"supporting_document_url" text,
	"code_of_conduct_accepted" boolean DEFAULT false NOT NULL,
	"privacy_consent_accepted" boolean DEFAULT false NOT NULL,
	"reviewer_id" text,
	"reviewer_notes" text,
	"decision_at" text,
	"submitted_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" text NOT NULL,
	"image_url" text,
	"file_url" text,
	"author_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"event_date" text,
	"event_location" text,
	"is_member_only" boolean DEFAULT false NOT NULL,
	"published_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "content_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" text PRIMARY KEY NOT NULL,
	"content_item_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" text,
	"national_id_number" text,
	"gender" text,
	"phone" text NOT NULL,
	"physical_address" text,
	"region" text,
	"employer" text,
	"current_role" text,
	"years_of_experience" integer,
	"certifications" text,
	"areas_of_expertise" text,
	"bio" text,
	"photo_url" text,
	"membership_category" text,
	"bio_is_public" boolean DEFAULT false NOT NULL,
	"years_experience_is_public" boolean DEFAULT false NOT NULL,
	"areas_of_expertise_is_public" boolean DEFAULT false NOT NULL,
	"employer_role_is_public" boolean DEFAULT false NOT NULL,
	"certifications_is_public" boolean DEFAULT false NOT NULL,
	"photo_is_public" boolean DEFAULT false NOT NULL,
	"allow_public_contact" boolean DEFAULT false NOT NULL,
	"is_listed_in_directory" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "member_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"subscribed_at" text NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"channel" text NOT NULL,
	"template_key" text NOT NULL,
	"recipient" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"error_message" text,
	"payload" text,
	"sent_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_request_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"service_request_id" text NOT NULL,
	"sender_role" text NOT NULL,
	"sender_name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"expert_user_id" text NOT NULL,
	"assigned_expert_user_id" text,
	"assigned_at" text,
	"access_token" text,
	"requester_name" text NOT NULL,
	"requester_email" text NOT NULL,
	"requester_phone" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"handled_by" text,
	"expert_notified_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "service_requests_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'applicant' NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" text,
	"password_reset_token_hash" text,
	"password_reset_expires_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
