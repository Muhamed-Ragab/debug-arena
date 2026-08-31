import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { adminRole, EMBEDDING_DIM, userRole } from "@/db/schema/roles";
import { users } from "@/features/auth/schema";
import { categories } from "@/features/category/schema";

export { categories } from "@/features/category/schema";

// --- Enums ---
export const challengeFormatEnum = pgEnum("challenge_format", [
  "code_snippet",
  "log_only",
  "ui_recording",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "draft",
  "published",
  "archived",
]);

export const challengeSourceEnum = pgEnum("challenge_source", [
  "manual",
  "ai_generated",
  "postmortem_import",
]);

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

// --- challenges ---
export const challenges = pgTable(
  "challenges",
  {
    buggyArtifact: jsonb("buggy_artifact").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    difficulty: difficultyEnum("difficulty").notNull(),
    format: challengeFormatEnum("format").notNull().default("code_snippet"),
    id: uuid("id").primaryKey().defaultRandom(),
    preventionNotes: text("prevention_notes"),
    prompt: text("prompt").notNull(),
    referenceFix: jsonb("reference_fix").notNull(),
    rootCauseEmbedding: vector("root_cause_embedding", {
      dimensions: EMBEDDING_DIM,
    }),
    rootCauseSummary: text("root_cause_summary").notNull(),
    source: challengeSourceEnum("source").notNull().default("manual"),
    status: challengeStatusEnum("status").notNull().default("draft"),
    title: text("title").notNull(),
  },
  (t) => [
    index("root_cause_embedding_idx").using(
      "hnsw",
      t.rootCauseEmbedding.op("vector_cosine_ops")
    ),
    pgPolicy("admin_all_challenges", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_read_published", {
      for: "select",
      to: userRole,
      using: sql`${t.status} = 'published'`,
    }),
  ]
);

// --- hints ---
export const hints = pgTable(
  "hints",
  {
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
    order: integer("order").notNull(),
    penaltyPoints: integer("penalty_points").notNull().default(10),
    socraticPrompt: text("socratic_prompt").notNull(),
  },
  (_t) => [
    pgPolicy("admin_all_hints", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_read_hints", {
      for: "select",
      to: userRole,
      using: sql`true`,
    }),
  ]
);

// --- challenge_embeddings ---
export const challengeEmbeddings = pgTable(
  "challenge_embeddings",
  {
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIM }).notNull(),
    id: uuid("id").primaryKey().defaultRandom(),
  },
  (t) => [
    index("challenge_embedding_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops")
    ),
    index("challenge_embedding_challenge_idx").on(t.challengeId),
    pgPolicy("admin_all_challenge_embeddings", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_read_challenge_embeddings", {
      for: "select",
      to: userRole,
      using: sql`true`,
    }),
  ]
);

// --- submissions ---
export const submissions = pgTable(
  "submissions",
  {
    aiFeedback: text("ai_feedback"),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    evaluationDetails: jsonb("evaluation_details"),
    fixCorrect: boolean("fix_correct"),
    hintsUsed: integer("hints_used").notNull().default(0),
    id: uuid("id").primaryKey().defaultRandom(),
    localizationAnswer: text("localization_answer"),
    localizationCorrect: boolean("localization_correct"),
    preventionAnswer: text("prevention_answer"),
    preventionScore: integer("prevention_score"),
    proposedFix: jsonb("proposed_fix"),
    rootCauseEmbedding: vector("root_cause_embedding", {
      dimensions: EMBEDDING_DIM,
    }),
    rootCauseExplanation: text("root_cause_explanation"),
    rootCauseScore: integer("root_cause_score"),
    timeSpentSeconds: integer("time_spent_seconds"),
    totalScore: integer("total_score"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    check("score_check", sql`${t.totalScore} >= 0 AND ${t.totalScore} <= 100`),
    pgPolicy("admin_all_submissions", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_own_submissions", {
      for: "all",
      to: userRole,
      using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
      withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    }),
  ]
);
