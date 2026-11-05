ALTER TABLE "investigations" ADD COLUMN "issue_title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "issue_body" text;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "issue_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "issue_state" text NOT NULL;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "issue_author" text;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "issue_labels" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "investigations" ADD COLUMN "issue_updated_at" timestamp with time zone NOT NULL;