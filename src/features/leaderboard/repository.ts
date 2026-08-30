import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { OFFLINE_MESSAGE, toOfflineError } from "@/lib/offline";
import { ConflictError } from "@/lib/safe-action/errors";
import type {
  LeaderboardRepository,
  UserWithCategoryStatsAndSubmissions,
  UserWithSubmissions,
} from "./types";

function handleDbError(err: unknown, context: string): never {
  const { code } = err as { code?: string };
  if (code === "23505") {
    throw new ConflictError(`Unique constraint violation in ${context}`, {
      cause: err as Error,
    });
  }
  if (code === "23503") {
    throw new ConflictError(`Foreign key violation in ${context}`, {
      cause: err as Error,
    });
  }
  console.warn(`[leaderboardRepository.${context}] DB error:`, err);
  throw toOfflineError(err, OFFLINE_MESSAGE);
}

export function createLeaderboardRepository(
  dbClient: typeof db = db
): LeaderboardRepository {
  async function findAllUsersWithSubmissions(): Promise<UserWithSubmissions> {
    try {
      return (await dbClient.query.users.findMany({
        where: and(
          eq(schema.users.banned, false),
          eq(schema.users.role, "user")
        ),
        with: {
          submissions: true,
        },
      })) as UserWithSubmissions;
    } catch (err) {
      handleDbError(err, "findAllUsersWithSubmissions");
    }
  }

  async function findAllWithCategoryStats(): Promise<
    UserWithCategoryStatsAndSubmissions[]
  > {
    try {
      return (await dbClient.query.users.findMany({
        where: and(
          eq(schema.users.banned, false),
          eq(schema.users.role, "user")
        ),
        with: {
          categoryStats: {
            with: {
              category: true,
            },
          },
          submissions: true,
        },
      })) as UserWithCategoryStatsAndSubmissions[];
    } catch (err) {
      handleDbError(err, "findAllWithCategoryStats");
    }
  }

  async function findByIdWithRelations(
    userId: string
  ): Promise<UserWithCategoryStatsAndSubmissions | null> {
    try {
      const user = await dbClient.query.users.findFirst({
        where: eq(schema.users.id, userId),
        with: {
          categoryStats: {
            with: {
              category: true,
            },
          },
          submissions: true,
        },
      });
      return (user as UserWithCategoryStatsAndSubmissions | undefined) ?? null;
    } catch (err) {
      handleDbError(err, "findByIdWithRelations");
    }
  }

  return {
    findAllUsersWithSubmissions,
    findAllWithCategoryStats,
    findByIdWithRelations,
  };
}

export const leaderboardRepository = createLeaderboardRepository();
