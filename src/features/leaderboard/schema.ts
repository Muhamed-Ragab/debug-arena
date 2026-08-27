import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgPolicy,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { adminRole, analyticsSchema, userRole } from "@/db/schema/roles";
import { users } from "@/features/auth/schema";
import { categories } from "@/features/challenge/schema";

// --- Enums ---
export const leaderboardPeriodEnum = pgEnum("leaderboard_period", [
  "weekly",
  "all_time",
]);

// --- analyticsSchema tables ---
export const userCategoryStats = analyticsSchema.table(
  "user_category_stats",
  {
    attempts: integer("attempts").notNull().default(0),
    avgScore: integer("avg_score").notNull().default(0),
    avgTimeSeconds: integer("avg_time_seconds").notNull().default(0),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    rootCauseAccuracyPercent: integer("root_cause_accuracy_percent")
      .notNull()
      .default(0),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    weakSpotRank: integer("weak_spot_rank"),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.categoryId] }),
    pgPolicy("admin_all_stats", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_read_own_stats", {
      for: "select",
      to: userRole,
      using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    }),
  ]
);

export const leaderboardEntries = analyticsSchema.table(
  "leaderboard_entries",
  {
    categoryId: uuid("category_id").references(() => categories.id),
    id: uuid("id").primaryKey().defaultRandom(),
    period: leaderboardPeriodEnum("period").notNull(),
    rank: integer("rank").notNull(),
    totalScore: integer("total_score").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    index("leaderboard_period_idx").on(t.period, t.categoryId),
    pgPolicy("admin_all_leaderboards", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_read_leaderboards", {
      for: "select",
      to: userRole,
      using: sql`true`,
    }),
  ]
);
