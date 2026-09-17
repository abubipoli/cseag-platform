CREATE TABLE "content_reads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"content_id" text NOT NULL,
	"read_at" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "content_reads_user_content_idx" ON "content_reads" USING btree ("user_id","content_id");