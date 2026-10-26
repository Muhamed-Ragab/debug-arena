import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminRole, userRole } from "@/db/schema/roles";
import { users } from "@/features/auth/schema";

// --- Enums ---
export const profileLinkPlatformEnum = pgEnum("profile_link_platform", [
  "github",
  "gitlab",
  "twitter",
  "linkedin",
  "website",
  "stackoverflow",
]);

// --- profile_links ---
export const profileLinks = pgTable(
  "profile_links",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    id: uuid("id").primaryKey().defaultRandom(),
    platform: profileLinkPlatformEnum("platform").notNull(),
    url: text("url").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    pgPolicy("admin_all_profile_links", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_own_profile_links", {
      for: "all",
      to: userRole,
      using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
      withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    }),
  ]
);

// --- user_api_keys ---
export const userApiKeys = pgTable(
  "user_api_keys",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    encryptedApiKey: text("encrypted_api_key").notNull(),
    id: uuid("id").primaryKey().defaultRandom(),
    keyPreview: text("key_preview").notNull(),
    provider: text("provider").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("user_api_keys_user_provider_idx").on(t.userId, t.provider),
    pgPolicy("admin_all_user_api_keys", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_own_user_api_keys", {
      for: "all",
      to: userRole,
      using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
      withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    }),
  ]
);

// --- user_ai_settings ---
export const userAiSettings = pgTable(
  "user_ai_settings",
  {
    activeModel: text("active_model").notNull().default("openai/gpt-oss-120b"),
    activeProvider: text("active_provider").notNull().default("platform"),
    customModel: text("custom_model"),
    id: uuid("id").primaryKey().defaultRandom(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
  },
  (t) => [
    pgPolicy("admin_all_user_ai_settings", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_own_user_ai_settings", {
      for: "all",
      to: userRole,
      using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
      withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    }),
  ]
);
