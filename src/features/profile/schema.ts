import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
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

export type ProfileLinkSelect = typeof profileLinks.$inferSelect;
export type ProfileLinkInsert = typeof profileLinks.$inferInsert;
