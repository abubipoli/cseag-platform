CREATE SEQUENCE "service_request_ticket_seq" START 10001;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "ticket_number" text;--> statement-breakpoint
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM "service_requests" ORDER BY created_at ASC, id ASC LOOP
    UPDATE "service_requests" SET ticket_number = 'SR-' || nextval('service_request_ticket_seq')::text WHERE id = r.id;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "service_requests" ALTER COLUMN "ticket_number" SET DEFAULT 'SR-' || nextval('service_request_ticket_seq')::text;--> statement-breakpoint
ALTER TABLE "service_requests" ALTER COLUMN "ticket_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_ticket_number_unique" UNIQUE("ticket_number");
