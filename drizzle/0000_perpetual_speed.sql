CREATE SCHEMA "analytics";
--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."challenge_format" AS ENUM('code_snippet', 'log_only', 'ui_recording');--> statement-breakpoint
CREATE TYPE "public"."challenge_source" AS ENUM('manual', 'ai_generated', 'postmortem_import');--> statement-breakpoint
CREATE TYPE "public"."challenge_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."leaderboard_period" AS ENUM('weekly', 'all_time');--> statement-breakpoint
CREATE TYPE "public"."profile_link_platform" AS ENUM('github', 'gitlab', 'twitter', 'linkedin', 'website', 'stackoverflow');--> statement-breakpoint
CREATE TABLE "bug_injection_jobs" (
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"error_message" text,
	"generated_challenge_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_repo_url" text NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bug_injection_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_templates" (
	"body_html" text NOT NULL,
	"body_text" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"subject" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variables" jsonb,
	CONSTRAINT "email_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "email_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "accounts" (
	"access_token" text,
	"access_token_expires_at" timestamp with time zone,
	"account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"issuer" text NOT NULL,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" text NOT NULL,
	"reason" text,
	"success" boolean DEFAULT false NOT NULL,
	"user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "login_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"avatar_url" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_rating" integer DEFAULT 1000 NOT NULL,
	"display_name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image" text,
	"last_activity_date" timestamp,
	"name" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "categories" (
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "challenge_embeddings" (
	"challenge_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenge_embeddings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "challenges" (
	"buggy_artifact" jsonb NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"format" "challenge_format" DEFAULT 'code_snippet' NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prevention_notes" text,
	"prompt" text NOT NULL,
	"reference_fix" jsonb NOT NULL,
	"root_cause_embedding" vector(1536),
	"root_cause_summary" text NOT NULL,
	"source" "challenge_source" DEFAULT 'manual' NOT NULL,
	"status" "challenge_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hints" (
	"challenge_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order" integer NOT NULL,
	"penalty_points" integer DEFAULT 10 NOT NULL,
	"socratic_prompt" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "submissions" (
	"challenge_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fix_correct" boolean,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"localization_answer" text,
	"localization_correct" boolean,
	"prevention_answer" text,
	"prevention_score" integer,
	"proposed_fix" jsonb,
	"root_cause_embedding" vector(1536),
	"root_cause_explanation" text,
	"root_cause_score" integer,
	"time_spent_seconds" integer,
	"total_score" integer,
	"user_id" uuid NOT NULL,
	CONSTRAINT "score_check" CHECK ("submissions"."total_score" >= 0 AND "submissions"."total_score" <= 100)
);
--> statement-breakpoint
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "analytics"."leaderboard_entries" (
	"category_id" uuid,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period" "leaderboard_period" NOT NULL,
	"rank" integer NOT NULL,
	"total_score" integer NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics"."leaderboard_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "analytics"."user_category_stats" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"avg_score" integer DEFAULT 0 NOT NULL,
	"avg_time_seconds" integer DEFAULT 0 NOT NULL,
	"category_id" uuid NOT NULL,
	"root_cause_accuracy_percent" integer DEFAULT 0 NOT NULL,
	"user_id" uuid NOT NULL,
	"weak_spot_rank" integer,
	CONSTRAINT "user_category_stats_user_id_category_id_pk" PRIMARY KEY("user_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "analytics"."user_category_stats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_links" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "profile_link_platform" NOT NULL,
	"url" text NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bug_injection_jobs" ADD CONSTRAINT "bug_injection_jobs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_injection_jobs" ADD CONSTRAINT "bug_injection_jobs_generated_challenge_id_challenges_id_fk" FOREIGN KEY ("generated_challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_embeddings" ADD CONSTRAINT "challenge_embeddings_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hints" ADD CONSTRAINT "hints_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."user_category_stats" ADD CONSTRAINT "user_category_stats_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics"."user_category_stats" ADD CONSTRAINT "user_category_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_links" ADD CONSTRAINT "profile_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_template_slug_idx" ON "email_templates" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "login_attempt_ip_idx" ON "login_attempts" USING btree ("ip_address","attempted_at");--> statement-breakpoint
CREATE INDEX "login_attempt_email_idx" ON "login_attempts" USING btree ("email","attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "challenge_embedding_idx" ON "challenge_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "challenge_embedding_challenge_idx" ON "challenge_embeddings" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "root_cause_embedding_idx" ON "challenges" USING hnsw ("root_cause_embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "leaderboard_period_idx" ON "analytics"."leaderboard_entries" USING btree ("period","category_id");--> statement-breakpoint
CREATE POLICY "admin_all_jobs" ON "bug_injection_jobs" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "admin_all_email_templates" ON "email_templates" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_read_email_templates" ON "email_templates" AS PERMISSIVE FOR SELECT TO "user" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all_login_attempts" ON "login_attempts" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "admin_all_users" ON "users" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_own_profile" ON "users" AS PERMISSIVE FOR ALL TO "user" USING ("users"."id" = (select current_setting('request.jwt.claim.sub')::uuid)) WITH CHECK ("users"."id" = (select current_setting('request.jwt.claim.sub')::uuid));--> statement-breakpoint
CREATE POLICY "admin_all_categories" ON "categories" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_read_categories" ON "categories" AS PERMISSIVE FOR SELECT TO "user" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all_challenge_embeddings" ON "challenge_embeddings" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_read_challenge_embeddings" ON "challenge_embeddings" AS PERMISSIVE FOR SELECT TO "user" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all_challenges" ON "challenges" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_read_published" ON "challenges" AS PERMISSIVE FOR SELECT TO "user" USING ("challenges"."status" = 'published');--> statement-breakpoint
CREATE POLICY "admin_all_hints" ON "hints" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_read_hints" ON "hints" AS PERMISSIVE FOR SELECT TO "user" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all_submissions" ON "submissions" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_own_submissions" ON "submissions" AS PERMISSIVE FOR ALL TO "user" USING ("submissions"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid)) WITH CHECK ("submissions"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid));--> statement-breakpoint
CREATE POLICY "admin_all_leaderboards" ON "analytics"."leaderboard_entries" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_read_leaderboards" ON "analytics"."leaderboard_entries" AS PERMISSIVE FOR SELECT TO "user" USING (true);--> statement-breakpoint
CREATE POLICY "admin_all_stats" ON "analytics"."user_category_stats" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_read_own_stats" ON "analytics"."user_category_stats" AS PERMISSIVE FOR SELECT TO "user" USING ("analytics"."user_category_stats"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid));--> statement-breakpoint
CREATE POLICY "admin_all_profile_links" ON "profile_links" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_own_profile_links" ON "profile_links" AS PERMISSIVE FOR ALL TO "user" USING ("profile_links"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid)) WITH CHECK ("profile_links"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid));