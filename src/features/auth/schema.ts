import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminRole, userRole } from "@/db/schema/roles";

// --- Enums ---
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// --- users ---
export const users = pgTable(
  "users",
  {
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    currentRating: integer("current_rating").notNull().default(1000),
    displayName: text("display_name"),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    id: uuid("id").primaryKey().defaultRandom(),
    image: text("image"),
    lastActivityDate: timestamp("last_activity_date", { mode: "date" }),
    name: text("name"),
    role: userRoleEnum("role").notNull().default("user"),
    streakCount: integer("streak_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    username: text("username").unique(),
  },
  (t) => [
    uniqueIndex("email_idx").on(t.email),
    pgPolicy("admin_all_users", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_own_profile", {
      for: "all",
      to: userRole,
      using: sql`${t.id} = (select current_setting('request.jwt.claim.sub')::uuid)`,
      withCheck: sql`${t.id} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    }),
  ]
);

// --- accounts (better-auth) ---
export const accounts = pgTable(
  "accounts",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    accountId: text("account_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    idToken: text("id_token"),
    issuer: text("issuer").notNull(),
    password: text("password"),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("accounts_provider_account_idx").on(t.providerId, t.accountId),
  ]
);

// --- login_attempts ---
export const loginAttempts = pgTable(
  "login_attempts",
  {
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    email: text("email"),
    id: uuid("id").primaryKey().defaultRandom(),
    ipAddress: text("ip_address").notNull(),
    reason: text("reason"),
    success: boolean("success").notNull().default(false),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("login_attempt_ip_idx").on(t.ipAddress, t.attemptedAt),
    index("login_attempt_email_idx").on(t.email, t.attemptedAt),
    pgPolicy("admin_all_login_attempts", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ]
);

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
