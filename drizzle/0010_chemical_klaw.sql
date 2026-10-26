CREATE TABLE "user_ai_settings" (
	"active_model" text DEFAULT 'openai/gpt-oss-120b' NOT NULL,
	"active_provider" text DEFAULT 'platform' NOT NULL,
	"custom_model" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "user_ai_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_ai_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_api_keys" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_preview" text NOT NULL,
	"provider" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_api_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD CONSTRAINT "user_ai_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_api_keys_user_provider_idx" ON "user_api_keys" USING btree ("user_id","provider");--> statement-breakpoint
CREATE POLICY "admin_all_user_ai_settings" ON "user_ai_settings" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_own_user_ai_settings" ON "user_ai_settings" AS PERMISSIVE FOR ALL TO "user" USING ("user_ai_settings"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid)) WITH CHECK ("user_ai_settings"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid));--> statement-breakpoint
CREATE POLICY "admin_all_user_api_keys" ON "user_api_keys" AS PERMISSIVE FOR ALL TO "admin" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_own_user_api_keys" ON "user_api_keys" AS PERMISSIVE FOR ALL TO "user" USING ("user_api_keys"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid)) WITH CHECK ("user_api_keys"."user_id" = (select current_setting('request.jwt.claim.sub')::uuid));