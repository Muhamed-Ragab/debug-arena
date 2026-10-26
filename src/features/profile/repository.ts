import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { OFFLINE_MESSAGE, toOfflineError } from "@/lib/offline";
import type {
  CategoryStatRow,
  ProfileRepository,
  PublishedChallenge,
  UserAiSettingsRow,
  UserApiKeyRow,
  UserForSettings,
  UserRow,
  UserWithRelations,
} from "./types";

export function createProfileRepository(
  dbClient: typeof db = db
): ProfileRepository {
  async function deleteUser(userId: string): Promise<void> {
    try {
      await dbClient.delete(schema.users).where(eq(schema.users.id, userId));
    } catch (err) {
      console.warn("[profileRepository.deleteUser] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function findByIdForSettings(
    userId: string
  ): Promise<UserForSettings | null> {
    try {
      const user = await dbClient.query.users.findFirst({
        where: eq(schema.users.id, userId),
        with: {
          accounts: true,
          loginAttempts: {
            limit: 5,
            orderBy: [desc(schema.loginAttempts.attemptedAt)],
          },
        },
      });

      return (user as UserForSettings | undefined) ?? null;
    } catch (err) {
      console.warn("[profileRepository.findByIdForSettings] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function findByIdWithRelations(userId: string): Promise<{
    user: UserWithRelations | null;
    publishedChallenges: PublishedChallenge[];
  }> {
    try {
      const user = await dbClient.query.users.findFirst({
        where: eq(schema.users.id, userId),
        with: {
          accounts: true,
          categoryStats: {
            with: {
              category: true,
            },
          },
          profileLinks: true,
        },
      });

      if (!user) {
        const publishedChallenges = await dbClient.query.challenges.findMany({
          where: eq(schema.challenges.status, "published"),
          with: {
            category: true,
          },
        });
        return {
          publishedChallenges: publishedChallenges as PublishedChallenge[],
          user: null,
        };
      }

      const [allSubmissions, publishedChallenges] = await Promise.all([
        dbClient.query.submissions.findMany({
          orderBy: [desc(schema.submissions.createdAt)],
          where: eq(schema.submissions.userId, userId),
          with: {
            challenge: {
              with: {
                category: true,
              },
            },
          },
        }),
        dbClient.query.challenges.findMany({
          where: eq(schema.challenges.status, "published"),
          with: {
            category: true,
          },
        }),
      ]);

      const userWithRelations = {
        ...user,
        submissions: allSubmissions,
      } as unknown as UserWithRelations;

      return {
        publishedChallenges: publishedChallenges as PublishedChallenge[],
        user: userWithRelations,
      };
    } catch (err) {
      console.warn("[profileRepository.findByIdWithRelations] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function findCategoryStats(
    userId: string,
    categoryId: string
  ): Promise<CategoryStatRow | null> {
    try {
      const stat = await dbClient.query.userCategoryStats.findFirst({
        where: and(
          eq(schema.userCategoryStats.userId, userId),
          eq(schema.userCategoryStats.categoryId, categoryId)
        ),
      });

      return (stat as CategoryStatRow | undefined) ?? null;
    } catch (err) {
      console.warn("[profileRepository.findCategoryStats] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function findAllSubmissionsByUserId(
    userId: string,
    limit?: number
  ): Promise<UserWithRelations["submissions"]> {
    try {
      const subs = await dbClient.query.submissions.findMany({
        ...(limit ? { limit } : {}),
        orderBy: [desc(schema.submissions.createdAt)],
        where: eq(schema.submissions.userId, userId),
        with: {
          challenge: {
            with: {
              category: true,
            },
          },
        },
      });
      return subs as unknown as UserWithRelations["submissions"];
    } catch (err) {
      console.warn(
        "[profileRepository.findAllSubmissionsByUserId] DB error:",
        err
      );
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function updateUser(
    userId: string,
    data: Partial<typeof schema.users.$inferInsert>
  ): Promise<UserRow | null> {
    try {
      const [updated] = await dbClient
        .update(schema.users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.users.id, userId))
        .returning();

      return (updated as UserRow | undefined) ?? null;
    } catch (err) {
      console.warn("[profileRepository.updateUser] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function upsertCategoryStats(
    data: typeof schema.userCategoryStats.$inferInsert
  ): Promise<CategoryStatRow | null> {
    try {
      const [row] = await dbClient
        .insert(schema.userCategoryStats)
        .values(data)
        .onConflictDoUpdate({
          set: data,
          target: [
            schema.userCategoryStats.userId,
            schema.userCategoryStats.categoryId,
          ],
        })
        .returning();

      return (row as CategoryStatRow | undefined) ?? null;
    } catch (err) {
      console.warn("[profileRepository.upsertCategoryStats] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function findApiKeysByUserId(userId: string): Promise<UserApiKeyRow[]> {
    try {
      const keys = await dbClient.query.userApiKeys.findMany({
        orderBy: [desc(schema.userApiKeys.updatedAt)],
        where: eq(schema.userApiKeys.userId, userId),
      });
      return keys;
    } catch (err) {
      console.warn("[profileRepository.findApiKeysByUserId] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function findApiKeyByProvider(
    userId: string,
    provider: string
  ): Promise<UserApiKeyRow | null> {
    try {
      const key = await dbClient.query.userApiKeys.findFirst({
        where: and(
          eq(schema.userApiKeys.userId, userId),
          eq(schema.userApiKeys.provider, provider)
        ),
      });
      return key ?? null;
    } catch (err) {
      console.warn("[profileRepository.findApiKeyByProvider] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function upsertApiKey(
    data: typeof schema.userApiKeys.$inferInsert
  ): Promise<UserApiKeyRow> {
    try {
      const [saved] = await dbClient
        .insert(schema.userApiKeys)
        .values(data)
        .onConflictDoUpdate({
          set: {
            encryptedApiKey: data.encryptedApiKey,
            keyPreview: data.keyPreview,
            updatedAt: data.updatedAt ?? new Date(),
          },
          target: [schema.userApiKeys.userId, schema.userApiKeys.provider],
        })
        .returning();

      return saved;
    } catch (err) {
      console.warn("[profileRepository.upsertApiKey] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function deleteApiKey(userId: string, provider: string): Promise<void> {
    try {
      await dbClient
        .delete(schema.userApiKeys)
        .where(
          and(
            eq(schema.userApiKeys.userId, userId),
            eq(schema.userApiKeys.provider, provider)
          )
        );
    } catch (err) {
      console.warn("[profileRepository.deleteApiKey] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function findAiSettingsByUserId(
    userId: string
  ): Promise<UserAiSettingsRow | null> {
    try {
      const settings = await dbClient.query.userAiSettings.findFirst({
        where: eq(schema.userAiSettings.userId, userId),
      });
      return settings ?? null;
    } catch (err) {
      console.warn("[profileRepository.findAiSettingsByUserId] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function upsertAiSettings(
    data: typeof schema.userAiSettings.$inferInsert
  ): Promise<UserAiSettingsRow> {
    try {
      const [saved] = await dbClient
        .insert(schema.userAiSettings)
        .values(data)
        .onConflictDoUpdate({
          set: {
            activeModel: data.activeModel,
            activeProvider: data.activeProvider,
            customModel: data.customModel,
            updatedAt: data.updatedAt ?? new Date(),
          },
          target: schema.userAiSettings.userId,
        })
        .returning();

      return saved;
    } catch (err) {
      console.warn("[profileRepository.upsertAiSettings] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  return {
    deleteApiKey,
    deleteUser,
    findAiSettingsByUserId,
    findAllSubmissionsByUserId,
    findApiKeyByProvider,
    findApiKeysByUserId,
    findByIdForSettings,
    findByIdWithRelations,
    findCategoryStats,
    updateUser,
    upsertAiSettings,
    upsertApiKey,
    upsertCategoryStats,
  };
}

export const profileRepository = createProfileRepository();
