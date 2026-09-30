DROP TABLE IF EXISTS "challenge_embeddings" CASCADE;--> statement-breakpoint
DROP INDEX IF EXISTS "root_cause_embedding_idx";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN IF EXISTS "root_cause_embedding";--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN IF EXISTS "root_cause_embedding";
