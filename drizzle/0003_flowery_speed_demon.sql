ALTER TABLE "users" ADD COLUMN "interests" text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_color" text;