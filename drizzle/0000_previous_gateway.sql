CREATE TYPE "public"."investigation_status" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "investigations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_owner" text NOT NULL,
	"repository_name" text NOT NULL,
	"issue_number" integer NOT NULL,
	"status" "investigation_status" DEFAULT 'queued' NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
