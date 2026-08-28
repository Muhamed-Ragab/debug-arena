import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

// --- Inferred relation types (no `any`, no aggregation) ---

type UserRow = typeof schema.users.$inferSelect;
type AccountRow = typeof schema.accounts.$inferSelect;
type CategoryStatRow = typeof schema.userCategoryStats.$inferSelect;
type CategoryRow = typeof schema.categories.$inferSelect;
type ProfileLinkRow = typeof schema.profileLinks.$inferSelect;
type SubmissionRow = typeof schema.submissions.$inferSelect;
type ChallengeRow = typeof schema.challenges.$inferSelect;
type LoginAttemptRow = typeof schema.loginAttempts.$inferSelect;

export type UserWithRelations = UserRow & {
  accounts: AccountRow[];
  categoryStats: (CategoryStatRow & { category: CategoryRow | null })[];
  profileLinks: ProfileLinkRow[];
  submissions: (SubmissionRow & {
    challenge: ChallengeRow & { category: CategoryRow | null };
  })[];
};

export type UserForSettings = UserRow & {
  accounts: AccountRow[];
  loginAttempts: LoginAttemptRow[];
};

export type PublishedChallenge = ChallengeRow & { category: CategoryRow | null };

export interface ProfileRepository {
  findByIdWithRelations: (
    userId: string
  ) => Promise<{
    user: UserWithRelations | null;
    publishedChallenges: PublishedChallenge[];
  }>;
  findByIdForSettings: (userId: string) => Promise<UserForSettings | null>;
  updateUser: (
    userId: string,
    data: Partial<typeof schema.users.$inferInsert>
  ) => Promise<UserRow | null>;
  findCategoryStats: (
    userId: string,
    category: string
  ) => Promise<CategoryStatRow | null>;
  upsertCategoryStats: (
    data: typeof schema.userCategoryStats.$inferInsert
  ) => Promise<CategoryStatRow | null>;
  deleteUser: (userId: string) => Promise<void>;
}

export const profileRepository: ProfileRepository = {
  async findByIdWithRelations(userId) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        accounts: true,
        categoryStats: {
          with: {
            category: true,
          },
        },
        profileLinks: true,
        submissions: {
          limit: 10,
          orderBy: [desc(schema.submissions.createdAt)],
          with: {
            challenge: {
              with: {
                category: true,
              },
            },
          },
        },
      },
    });

    const publishedChallenges = await db.query.challenges.findMany({
      where: eq(schema.challenges.status, "published"),
      with: {
        category: true,
      },
    });

    return { user: user ?? null, publishedChallenges };
  },

  async findByIdForSettings(userId) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        accounts: true,
        loginAttempts: {
          limit: 5,
          orderBy: [desc(schema.loginAttempts.attemptedAt)],
        },
      },
    });

    return user ?? null;
  },

  async updateUser(userId, data) {
    const [updated] = await db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning();

    return updated ?? null;
  },

  async findCategoryStats(userId, category) {
    const stat = await db.query.userCategoryStats.findFirst({
      where: and(
        eq(schema.userCategoryStats.userId, userId),
        eq(schema.userCategoryStats.categoryId, category)
      ),
    });

    return stat ?? null;
  },

  async upsertCategoryStats(data) {
    const [row] = await db
      .insert(schema.userCategoryStats)
      .values(data)
      .onConflictDoUpdate({
        target: [
          schema.userCategoryStats.userId,
          schema.userCategoryStats.categoryId,
        ],
        set: data,
      })
      .returning();

    return row ?? null;
  },

  async deleteUser(userId) {
    await db.delete(schema.users).where(eq(schema.users.id, userId));
  },
};
