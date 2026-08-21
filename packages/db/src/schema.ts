// Drizzle schema — mirrors erd.md
// pgvector used directly in-column (replaces a separate vector DB like Qdrant).

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { vector } from "pgvector/drizzle-orm";
import { relations } from "drizzle-orm";

// --- Enums ---
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const challengeFormatEnum = pgEnum("challenge_format", [
  "code_snippet",
  "log_only",
  "ui_recording",
]);
export const challengeSourceEnum = pgEnum("challenge_source", [
  "manual",
  "ai_generated",
  "postmortem_import",
]);
export const challengeStatusEnum = pgEnum("challenge_status", [
  "draft",
  "published",
  "archived",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
]);
export const leaderboardPeriodEnum = pgEnum("leaderboard_period", [
  "weekly",
  "all_time",
]);

// --- Embedding dimension: adjust to match chosen embedding model ---
const EMBEDDING_DIM = 1536;

// --- users ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  currentRating: integer("current_rating").notNull().default(1000),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- categories ---
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

// --- challenges ---
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  difficulty: difficultyEnum("difficulty").notNull(),
  format: challengeFormatEnum("format").notNull().default("code_snippet"),
  prompt: text("prompt").notNull(),
  buggyArtifact: jsonb("buggy_artifact").notNull(),
  referenceFix: jsonb("reference_fix").notNull(),
  rootCauseSummary: text("root_cause_summary").notNull(),
  rootCauseEmbedding: vector("root_cause_embedding", { dimensions: EMBEDDING_DIM }),
  preventionNotes: text("prevention_notes"),
  source: challengeSourceEnum("source").notNull().default("manual"),
  status: challengeStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- hints ---
export const hints = pgTable("hints", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  socraticPrompt: text("socratic_prompt").notNull(),
  penaltyPoints: integer("penalty_points").notNull().default(10),
});

// --- submissions ---
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  challengeId: uuid("challenge_id")
    .notNull()
    .references(() => challenges.id),
  localizationAnswer: text("localization_answer"),
  localizationCorrect: boolean("localization_correct"),
  rootCauseExplanation: text("root_cause_explanation"),
  rootCauseEmbedding: vector("root_cause_embedding", { dimensions: EMBEDDING_DIM }),
  rootCauseScore: integer("root_cause_score"),
  proposedFix: jsonb("proposed_fix"),
  fixCorrect: boolean("fix_correct"),
  preventionAnswer: text("prevention_answer"),
  preventionScore: integer("prevention_score"),
  hintsUsed: integer("hints_used").notNull().default(0),
  totalScore: integer("total_score"),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- bug_injection_jobs ---
export const bugInjectionJobs = pgTable("bug_injection_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceRepoUrl: text("source_repo_url").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  difficulty: difficultyEnum("difficulty").notNull(),
  status: jobStatusEnum("status").notNull().default("queued"),
  generatedChallengeId: uuid("generated_challenge_id").references(() => challenges.id),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- user_category_stats ---
export const userCategoryStats = pgTable(
  "user_category_stats",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    attempts: integer("attempts").notNull().default(0),
    avgScore: integer("avg_score").notNull().default(0),
    weakSpotRank: integer("weak_spot_rank"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.categoryId] }),
  })
);

// --- leaderboard_entries ---
export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  period: leaderboardPeriodEnum("period").notNull(),
  rank: integer("rank").notNull(),
  totalScore: integer("total_score").notNull(),
});

// --- relations (for Drizzle relational queries) ---
export const challengesRelations = relations(challenges, ({ one, many }) => ({
  category: one(categories, {
    fields: [challenges.categoryId],
    references: [categories.id],
  }),
  hints: many(hints),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  challenge: one(challenges, {
    fields: [submissions.challengeId],
    references: [challenges.id],
  }),
}));
