import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import type { Category } from "@/lib/domain/types";
import {
  getCachedLeaderboard,
  getLeaderboardCacheKey,
  setCachedLeaderboard,
} from "./cache";
import type { LeaderboardEntry } from "./types";

export { invalidateLeaderboardCache } from "./cache";

export interface GetLeaderboardOptions {
  categorySlug?: string | null;
  currentUserId?: string | null;
  limit?: number;
  period?: "weekly" | "all_time";
}

function getStrongestCategory(
  categoryStats: Array<{ avgScore: number; category?: { name: string } | null }>
): Category {
  if (categoryStats.length === 0) {
    return "State Mutations";
  }
  const sorted = [...categoryStats].sort((a, b) => b.avgScore - a.avgScore);
  return (sorted[0]?.category?.name as Category) || "State Mutations";
}

interface UserWithSubmissionsAndStats {
  categoryStats: Array<{
    avgScore: number;
    category?: { name: string } | null;
  }>;
  currentRating: number;
  displayName: string | null;
  id: string;
  name: string | null;
  streakCount: number;
  submissions: Array<{
    fixCorrect: boolean | null;
    totalScore: number | null;
  }>;
}

function buildUserLeaderboardEntry(
  user: UserWithSubmissionsAndStats,
  rank: number
): LeaderboardEntry {
  const solvedCount = user.submissions.filter(
    (s) => s.fixCorrect || (s.totalScore ?? 0) >= 60
  ).length;
  const totalSubmissions = user.submissions.length;
  const avgScore =
    totalSubmissions > 0
      ? Math.round(
          user.submissions.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) /
            totalSubmissions
        )
      : Math.min(100, Math.round(user.currentRating / 100));

  const totalScore = user.currentRating * 10 + solvedCount * 50;

  return {
    avgScore,
    name: user.displayName || user.name || "Anonymous",
    rank,
    score: totalScore,
    solved: solvedCount,
    streak: user.streakCount,
    strongest: getStrongestCategory(user.categoryStats),
    userId: user.id,
  };
}

export async function calculateUserRank(userId: string): Promise<string> {
  const allUsers = await db.query.users.findMany({
    where: eq(schema.users.banned, false),
    with: {
      submissions: true,
    },
  });

  const scores = allUsers.map((u) => {
    const solvedCount = u.submissions.filter(
      (s) => s.fixCorrect || (s.totalScore ?? 0) >= 60
    ).length;
    const totalPoints = u.currentRating * 10 + solvedCount * 50;
    return { id: u.id, score: totalPoints };
  });

  scores.sort((a, b) => b.score - a.score);
  const idx = scores.findIndex((s) => s.id === userId);
  return idx >= 0 ? `#${idx + 1}` : "#--";
}

async function fetchDbLeaderboard(
  _period: "weekly" | "all_time",
  limit: number
): Promise<LeaderboardEntry[]> {
  const allUsers = await db.query.users.findMany({
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

  // Calculate live score for each user
  const entriesWithScores = allUsers.map((u) => {
    const solvedCount = u.submissions.filter(
      (s) => s.fixCorrect || (s.totalScore ?? 0) >= 60
    ).length;
    const totalScore = u.currentRating * 10 + solvedCount * 50;
    return { totalScore, user: u };
  });

  // Sort descending by score
  entriesWithScores.sort((a, b) => b.totalScore - a.totalScore);

  return entriesWithScores
    .slice(0, limit)
    .map(({ user }, idx) => buildUserLeaderboardEntry(user, idx + 1));
}

export async function getTopLeaderboard(
  options: GetLeaderboardOptions = {}
): Promise<LeaderboardEntry[]> {
  const {
    period = "all_time",
    categorySlug = null,
    currentUserId = null,
    limit = 100,
  } = options;

  const cacheKey = getLeaderboardCacheKey(period, categorySlug);
  const cached = await getCachedLeaderboard(cacheKey);

  let rawEntries: LeaderboardEntry[];

  if (cached && cached.length > 0) {
    rawEntries = cached;
  } else {
    rawEntries = await fetchDbLeaderboard(period, limit);
    if (rawEntries.length > 0) {
      await setCachedLeaderboard(cacheKey, rawEntries);
    }
  }

  const entriesWithUserFlag = rawEntries.map((e) => ({
    ...e,
    isUser: Boolean(currentUserId && e.userId === currentUserId),
  }));

  if (currentUserId && !entriesWithUserFlag.some((e) => e.isUser)) {
    const currentUser = await db.query.users.findFirst({
      where: eq(schema.users.id, currentUserId),
      with: {
        categoryStats: {
          with: {
            category: true,
          },
        },
        submissions: true,
      },
    });

    if (currentUser) {
      const userRank = await calculateUserRank(currentUserId);
      const parsedRank =
        Number.parseInt(userRank.replace("#", ""), 10) || rawEntries.length + 1;
      const userEntry = buildUserLeaderboardEntry(currentUser, parsedRank);
      entriesWithUserFlag.push({
        ...userEntry,
        isUser: true,
      });
    }
  }

  return entriesWithUserFlag;
}
