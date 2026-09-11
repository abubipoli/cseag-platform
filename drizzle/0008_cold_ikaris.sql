CREATE TABLE "donations" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"amount_ghs" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paystack_reference" text,
	"message" text,
	"created_at" text NOT NULL,
	CONSTRAINT "donations_paystack_reference_unique" UNIQUE("paystack_reference")
);
