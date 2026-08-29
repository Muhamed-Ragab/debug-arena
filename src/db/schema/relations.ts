import { relations } from "drizzle-orm";
import { accounts, loginAttempts, users } from "@/features/auth/schema";
import { categories } from "@/features/category/schema";
import {
  challengeEmbeddings,
  challenges,
  hints,
  submissions,
} from "@/features/challenge/schema";
import {
  leaderboardEntries,
  userCategoryStats,
} from "@/features/leaderboard/schema";
import { profileLinks } from "@/features/profile/schema";

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categoryStats: many(userCategoryStats),
  leaderboardEntries: many(leaderboardEntries),
  loginAttempts: many(loginAttempts),
  profileLinks: many(profileLinks),
  submissions: many(submissions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  categoryStats: many(userCategoryStats),
  challenges: many(challenges),
  leaderboardEntries: many(leaderboardEntries),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  category: one(categories, {
    fields: [challenges.categoryId],
    references: [categories.id],
  }),
  embeddings: many(challengeEmbeddings),
  hints: many(hints),
  submissions: many(submissions),
}));

export const hintsRelations = relations(hints, ({ one }) => ({
  challenge: one(challenges, {
    fields: [hints.challengeId],
    references: [challenges.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  challenge: one(challenges, {
    fields: [submissions.challengeId],
    references: [challenges.id],
  }),
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
}));

export const leaderboardEntriesRelations = relations(
  leaderboardEntries,
  ({ one }) => ({
    category: one(categories, {
      fields: [leaderboardEntries.categoryId],
      references: [categories.id],
    }),
    user: one(users, {
      fields: [leaderboardEntries.userId],
      references: [users.id],
    }),
  })
);

export const userCategoryStatsRelations = relations(
  userCategoryStats,
  ({ one }) => ({
    category: one(categories, {
      fields: [userCategoryStats.categoryId],
      references: [categories.id],
    }),
    user: one(users, {
      fields: [userCategoryStats.userId],
      references: [users.id],
    }),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, { fields: [loginAttempts.userId], references: [users.id] }),
}));

export const profileLinksRelations = relations(profileLinks, ({ one }) => ({
  user: one(users, { fields: [profileLinks.userId], references: [users.id] }),
}));

export const challengeEmbeddingsRelations = relations(
  challengeEmbeddings,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeEmbeddings.challengeId],
      references: [challenges.id],
    }),
  })
);
