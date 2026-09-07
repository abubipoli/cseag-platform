CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`statement_of_interest` text,
	`supporting_document_url` text,
	`code_of_conduct_accepted` integer DEFAULT false NOT NULL,
	`privacy_consent_accepted` integer DEFAULT false NOT NULL,
	`reviewer_id` text,
	`reviewer_notes` text,
	`decision_at` text,
	`submitted_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`details` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`author_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`event_date` text,
	`published_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_items_slug_unique` ON `content_items` (`slug`);--> statement-breakpoint
CREATE TABLE `member_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`full_name` text NOT NULL,
	`date_of_birth` text,
	`national_id_number` text,
	`gender` text,
	`phone` text NOT NULL,
	`physical_address` text,
	`region` text,
	`employer` text,
	`current_role` text,
	`years_of_experience` integer,
	`certifications` text,
	`areas_of_expertise` text,
	`bio` text,
	`photo_url` text,
	`membership_category` text,
	`bio_is_public` integer DEFAULT false NOT NULL,
	`years_experience_is_public` integer DEFAULT false NOT NULL,
	`areas_of_expertise_is_public` integer DEFAULT false NOT NULL,
	`employer_role_is_public` integer DEFAULT false NOT NULL,
	`certifications_is_public` integer DEFAULT false NOT NULL,
	`photo_is_public` integer DEFAULT false NOT NULL,
	`allow_public_contact` integer DEFAULT false NOT NULL,
	`is_listed_in_directory` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_profiles_user_id_unique` ON `member_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`channel` text NOT NULL,
	`template_key` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`error_message` text,
	`sent_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'applicant' NOT NULL,
	`mfa_enabled` integer DEFAULT false NOT NULL,
	`mfa_secret` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);