import { sql } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { adminRole, userRole } from "@/db/schema/roles";
import {
  categories,
  challenges,
  difficultyEnum,
} from "@/features/challenge/schema";

// --- Enums ---
export const jobStatusEnum = pgEnum("job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
]);

// --- bug_injection_jobs ---
export const bugInjectionJobs = pgTable(
  "bug_injection_jobs",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    difficulty: difficultyEnum("difficulty").notNull(),
    errorMessage: text("error_message"),
    generatedChallengeId: uuid("generated_challenge_id").references(
      () => challenges.id
    ),
    id: uuid("id").primaryKey().defaultRandom(),
    sourceRepoUrl: text("source_repo_url").notNull(),
    status: jobStatusEnum("status").notNull().default("queued"),
  },
  (_t) => [
    pgPolicy("admin_all_jobs", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ]
);

// --- email_templates ---
export const emailTemplates = pgTable(
  "email_templates",
  {
    bodyHtml: text("body_html").notNull(),
    bodyText: text("body_text"),
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    subject: text("subject").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    variables: jsonb("variables"),
  },
  (t) => [
    uniqueIndex("email_template_slug_idx").on(t.slug),
    pgPolicy("admin_all_email_templates", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_read_email_templates", {
      for: "select",
      to: userRole,
      using: sql`true`,
    }),
  ]
);
