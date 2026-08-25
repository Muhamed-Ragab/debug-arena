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
  index,
  pgRole,
  pgPolicy,
  pgSchema,
  check,
  uniqueIndex,
  vector
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// --- Roles ---
// By using existing(), we expect these roles to be provisioned at the DB level.
// Alternatively, remove .existing() and set { entities: { roles: true } } in drizzle.config.ts
export const adminRole = pgRole("admin").existing();
export const userRole = pgRole("user").existing();

// --- Schemas ---
export const analyticsSchema = pgSchema("analytics");

// --- Enums ---
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const challengeFormatEnum = pgEnum("challenge_format", ["code_snippet", "log_only", "ui_recording"]);
export const challengeSourceEnum = pgEnum("challenge_source", ["manual", "ai_generated", "postmortem_import"]);
export const challengeStatusEnum = pgEnum("challenge_status", ["draft", "published", "archived"]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "running", "succeeded", "failed"]);
export const leaderboardPeriodEnum = pgEnum("leaderboard_period", ["weekly", "all_time"]);

// --- Auth / profile / RAG enums ---
export const oauthProviderEnum = pgEnum("oauth_provider", ["google", "github", "gitlab", "discord", "apple"]);
export const sessionStatusEnum = pgEnum("session_status", ["active", "expired", "revoked"]);
export const profileLinkPlatformEnum = pgEnum("profile_link_platform", ["github", "gitlab", "twitter", "linkedin", "website", "stackoverflow"]);

const EMBEDDING_DIM = 1536;

// --- users ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("user"),
  currentRating: integer("current_rating").notNull().default(1000),
  streakCount: integer("streak_count").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date", { mode: 'date' }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex('email_idx').on(t.email),
  adminAllUsers: pgPolicy('admin_all_users', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userOwnProfile: pgPolicy('user_own_profile', {
    for: 'all',
    to: userRole,
    using: sql`${t.id} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    withCheck: sql`${t.id} = (select current_setting('request.jwt.claim.sub')::uuid)`
  })
}));

// --- categories ---
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
}, (t) => ({
  adminAllCategories: pgPolicy('admin_all_categories', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userReadCategories: pgPolicy('user_read_categories', { for: 'select', to: userRole, using: sql`true` })
}));

// --- challenges ---
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
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
}, (t) => ({
  // HNSW Index for fast vector similarity searches! (Requires pgvector)
  rootCauseEmbeddingIdx: index('root_cause_embedding_idx').using('hnsw', t.rootCauseEmbedding.op('vector_cosine_ops')),

  // RLS Policies
  adminAllChallenges: pgPolicy('admin_all_challenges', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userReadPublished: pgPolicy('user_read_published', {
    for: 'select',
    to: userRole,
    using: sql`${t.status} = 'published'`
  })
}));

// --- hints ---
export const hints = pgTable("hints", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  socraticPrompt: text("socratic_prompt").notNull(),
  penaltyPoints: integer("penalty_points").notNull().default(10),
}, (t) => ({
  adminAllHints: pgPolicy('admin_all_hints', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userReadHints: pgPolicy('user_read_hints', { for: 'select', to: userRole, using: sql`true` })
}));

// --- submissions ---
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
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
}, (t) => ({
  scoreCheck: check('score_check', sql`${t.totalScore} >= 0 AND ${t.totalScore} <= 100`),

  adminAllSubmissions: pgPolicy('admin_all_submissions', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userOwnSubmissions: pgPolicy('user_own_submissions', {
    for: 'all',
    to: userRole,
    using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`
  })
}));

// --- bug_injection_jobs ---
export const bugInjectionJobs = pgTable("bug_injection_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceRepoUrl: text("source_repo_url").notNull(),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  difficulty: difficultyEnum("difficulty").notNull(),
  status: jobStatusEnum("status").notNull().default("queued"),
  generatedChallengeId: uuid("generated_challenge_id").references(() => challenges.id),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Only admins can trigger and read injection jobs
  adminAllJobs: pgPolicy('admin_all_jobs', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` })
}));

// ==========================================
// ANALYTICS SCHEMA (Namespaced)
// ==========================================

export const userCategoryStats = analyticsSchema.table("user_category_stats", {
  userId: uuid("user_id").notNull().references(() => users.id),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  attempts: integer("attempts").notNull().default(0),
  avgScore: integer("avg_score").notNull().default(0),
  avgTimeSeconds: integer("avg_time_seconds").notNull().default(0),
  rootCauseAccuracyPercent: integer("root_cause_accuracy_percent").notNull().default(0),
  weakSpotRank: integer("weak_spot_rank"),
}, (t) => ({
  compositePk: primaryKey({ columns: [t.userId, t.categoryId] }),
  adminAllStats: pgPolicy('admin_all_stats', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userReadOwnStats: pgPolicy('user_read_own_stats', {
    for: 'select',
    to: userRole,
    using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`
  })
}));

export const leaderboardEntries = analyticsSchema.table("leaderboard_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  categoryId: uuid("category_id").references(() => categories.id), // Null = global
  period: leaderboardPeriodEnum("period").notNull(),
  rank: integer("rank").notNull(),
  totalScore: integer("total_score").notNull(),
}, (t) => ({
  leaderboardPeriodIdx: index('leaderboard_period_idx').on(t.period, t.categoryId),
  adminAllLeaderboards: pgPolicy('admin_all_leaderboards', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userReadLeaderboards: pgPolicy('user_read_leaderboards', { for: 'select', to: userRole, using: sql`true` })
}));

// --- sessions (multi-session auth) ---
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  status: sessionStatusEnum("status").notNull().default("active"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sessionUserIdx: index('session_user_idx').on(t.userId),
  adminAllSessions: pgPolicy('admin_all_sessions', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userOwnSessions: pgPolicy('user_own_sessions', {
    for: 'all',
    to: userRole,
    using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`
  })
}));

// --- oauth_accounts (OAuth identity linking) ---
export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: oauthProviderEnum("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  oauthProviderAccountIdx: uniqueIndex('oauth_provider_account_idx').on(t.provider, t.providerAccountId),
  adminAllOauth: pgPolicy('admin_all_oauth', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userOwnOauth: pgPolicy('user_own_oauth', {
    for: 'all',
    to: userRole,
    using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`
  })
}));

// --- login_attempts (rate limiting) ---
export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email"),
  ipAddress: text("ip_address").notNull(),
  success: boolean("success").notNull().default(false),
  reason: text("reason"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  loginAttemptIpIdx: index('login_attempt_ip_idx').on(t.ipAddress, t.attemptedAt),
  loginAttemptEmailIdx: index('login_attempt_email_idx').on(t.email, t.attemptedAt),
  adminAllLoginAttempts: pgPolicy('admin_all_login_attempts', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` })
}));

// --- email_verifications ---
export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  adminAllEmailVerifications: pgPolicy('admin_all_email_verifications', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userOwnEmailVerifications: pgPolicy('user_own_email_verifications', {
    for: 'all',
    to: userRole,
    using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`
  })
}));

// --- password_resets ---
export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  adminAllPasswordResets: pgPolicy('admin_all_password_resets', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userOwnPasswordResets: pgPolicy('user_own_password_resets', {
    for: 'all',
    to: userRole,
    using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`
  })
}));

// --- profile_links ---
export const profileLinks = pgTable("profile_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: profileLinkPlatformEnum("platform").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  adminAllProfileLinks: pgPolicy('admin_all_profile_links', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userOwnProfileLinks: pgPolicy('user_own_profile_links', {
    for: 'all',
    to: userRole,
    using: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`,
    withCheck: sql`${t.userId} = (select current_setting('request.jwt.claim.sub')::uuid)`
  })
}));

// --- email_templates ---
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  variables: jsonb("variables"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailTemplateSlugIdx: uniqueIndex('email_template_slug_idx').on(t.slug),
  adminAllEmailTemplates: pgPolicy('admin_all_email_templates', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userReadEmailTemplates: pgPolicy('user_read_email_templates', { for: 'select', to: userRole, using: sql`true` })
}));

// --- challenge_embeddings (RAG search) ---
export const challengeEmbeddings = pgTable("challenge_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: EMBEDDING_DIM }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // HNSW Index for fast vector similarity search over challenge embeddings (requires pgvector)
  challengeEmbeddingIdx: index('challenge_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
  challengeEmbeddingChallengeIdx: index('challenge_embedding_challenge_idx').on(t.challengeId),
  adminAllChallengeEmbeddings: pgPolicy('admin_all_challenge_embeddings', { for: 'all', to: adminRole, using: sql`true`, withCheck: sql`true` }),
  userReadChallengeEmbeddings: pgPolicy('user_read_challenge_embeddings', { for: 'select', to: userRole, using: sql`true` })
}));

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
  loginAttempts: many(loginAttempts),
  emailVerifications: many(emailVerifications),
  passwordResets: many(passwordResets),
  profileLinks: many(profileLinks),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  category: one(categories, {
    fields: [challenges.categoryId],
    references: [categories.id],
  }),
  hints: many(hints),
  submissions: many(submissions),
  embeddings: many(challengeEmbeddings),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  challenge: one(challenges, {
    fields: [submissions.challengeId],
    references: [challenges.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, { fields: [loginAttempts.userId], references: [users.id] }),
}));

export const emailVerificationsRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, { fields: [emailVerifications.userId], references: [users.id] }),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, { fields: [passwordResets.userId], references: [users.id] }),
}));

export const profileLinksRelations = relations(profileLinks, ({ one }) => ({
  user: one(users, { fields: [profileLinks.userId], references: [users.id] }),
}));

export const challengeEmbeddingsRelations = relations(challengeEmbeddings, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeEmbeddings.challengeId],
    references: [challenges.id],
  }),
}));
