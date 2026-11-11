ALTER TABLE "investigations" ADD COLUMN "analysis_model" text;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "openai_response_id" text;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "completed_at" timestamp with time zone;