import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

function queryAllUsersWithSubmissions() {
  return db.query.users.findMany({
    where: eq(schema.users.banned, false),
    with: {
      submissions: true,
    },
  });
}

function queryAllWithCategoryStats() {
  return db.query.users.findMany({
    where: eq(schema.users.banned, false),
    with: {
      categoryStats: {
        with: {
          category: true,
        },
      },
      submissions: true,
    },
  });
}

async function queryUserByIdWithRelations(userId: string) {
  const user = await db.query.users.findFirst({
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
  return user ?? null;
}

export type UserWithSubmissions = Awaited<
  ReturnType<typeof queryAllUsersWithSubmissions>
>;

export type UserWithCategoryStatsAndSubmissions = Awaited<
  ReturnType<typeof queryAllWithCategoryStats>
>[number];

export interface LeaderboardRepository {
  findAllUsersWithSubmissions: () => Promise<UserWithSubmissions>;
  findAllWithCategoryStats: () => Promise<
    UserWithCategoryStatsAndSubmissions[]
  >;
  findByIdWithRelations: (
    userId: string
  ) => Promise<UserWithCategoryStatsAndSubmissions | null>;
}

export const leaderboardRepository: LeaderboardRepository = {
  findAllUsersWithSubmissions: queryAllUsersWithSubmissions,
  findAllWithCategoryStats: queryAllWithCategoryStats,
  findByIdWithRelations: queryUserByIdWithRelations,
};
