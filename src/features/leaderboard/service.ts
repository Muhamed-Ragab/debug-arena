import type { Category } from "@/lib/domain/types";
import {
  getCachedLeaderboard,
  getLeaderboardCacheKey,
  setCachedLeaderboard,
} from "./cache";
import { SCORE_WEIGHT_RATING, SCORE_WEIGHT_SOLVED } from "./constants";
import { leaderboardRepository } from "./repository";
import type {
  GetLeaderboardOptions,
  LeaderboardEntry,
  LeaderboardRepository,
  UserWithSubmissionsAndStats,
} from "./types";

export function isSolved(submission: {
  fixCorrect: boolean | null;
  totalScore: number | null;
}): boolean {
  return Boolean(submission.fixCorrect || (submission.totalScore ?? 0) >= 60);
}

export function calcPoints(currentRating: number, solvedCount: number): number {
  return (
    currentRating * SCORE_WEIGHT_RATING + solvedCount * SCORE_WEIGHT_SOLVED
  );
}

export function getStrongestCategory(
  categoryStats: Array<{ avgScore: number; category?: { name: string } | null }>
): Category {
  if (categoryStats.length === 0) {
    return "State Mutations";
  }
  const sorted = [...categoryStats].sort((a, b) => b.avgScore - a.avgScore);
  return (sorted[0]?.category?.name as Category) || "State Mutations";
}

export function buildUserLeaderboardEntry(
  user: UserWithSubmissionsAndStats,
  rank: number
): LeaderboardEntry {
  const solvedCount = user.submissions.filter(isSolved).length;
  const totalSubmissions = user.submissions.length;
  const avgScore =
    totalSubmissions > 0
      ? Math.round(
          user.submissions.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) /
            totalSubmissions
        )
      : Math.min(100, Math.round(user.currentRating / 100));

  const totalScore = calcPoints(user.currentRating, solvedCount);

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

export function createLeaderboardService(
  repo: LeaderboardRepository = leaderboardRepository
) {
  async function calculateUserRank(userId: string): Promise<string> {
    const allUsers = await repo.findAllUsersWithSubmissions();
    const scores = allUsers.map((u) => {
      const solvedCount = u.submissions.filter(isSolved).length;
      const totalPoints = calcPoints(u.currentRating, solvedCount);
      return { id: u.id, score: totalPoints };
    });
    scores.sort((a, b) => b.score - a.score);
    const idx = scores.findIndex((s) => s.id === userId);
    return idx >= 0 ? `#${idx + 1}` : "#--";
  }

  // TODO(rank): push limit/order to SQL — currently fetches all users then sorts/slices in JS
  async function fetchDbLeaderboard(
    _period: "weekly" | "all_time",
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const allUsers = await repo.findAllWithCategoryStats();
    const entriesWithScores = allUsers.map((u) => {
      const solvedCount = u.submissions.filter(isSolved).length;
      const totalScore = calcPoints(u.currentRating, solvedCount);
      return { totalScore, user: u };
    });
    entriesWithScores.sort((a, b) => b.totalScore - a.totalScore);
    return entriesWithScores
      .slice(0, limit)
      .map(({ user }, idx) => buildUserLeaderboardEntry(user, idx + 1));
  }

  async function getTopLeaderboard(
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
      const currentUser = await repo.findByIdWithRelations(currentUserId);
      if (!currentUser) {
        return entriesWithUserFlag;
      }
      if (
        (currentUser as unknown as { role?: string }).role !== "user" ||
        (currentUser as unknown as { banned?: boolean }).banned === true
      ) {
        return entriesWithUserFlag;
      }
      const userRank = await calculateUserRank(currentUserId);
      const parsedRank =
        Number.parseInt(userRank.replace("#", ""), 10) || rawEntries.length + 1;
      const userEntry = buildUserLeaderboardEntry(
        currentUser as unknown as UserWithSubmissionsAndStats,
        parsedRank
      );
      entriesWithUserFlag.push({
        ...userEntry,
        isUser: true,
      });
    }

    return entriesWithUserFlag;
  }

  return {
    buildUserLeaderboardEntry,
    calcPoints,
    calculateUserRank,
    getStrongestCategory,
    getTopLeaderboard,
    isSolved,
  };
}

export const leaderboardService = createLeaderboardService(
  leaderboardRepository
);
