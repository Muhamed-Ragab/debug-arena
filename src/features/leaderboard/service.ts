import {
  calcPoints,
  countSolvedChallenges,
  filterLeaderboardSubmissions,
  isSolved,
} from "@/lib/domain/scoring";
import type { Category } from "@/lib/domain/types";
import {
  getCachedLeaderboard,
  getLeaderboardCacheKey,
  setCachedLeaderboard,
} from "./cache";
import { leaderboardRepository } from "./repository";
import type {
  GetLeaderboardOptions,
  LeaderboardEntry,
  LeaderboardRepository,
  LeaderboardSubmission,
  UserWithSubmissionsAndStats,
} from "./types";

export { calcPoints, isSolved } from "@/lib/domain/scoring";

export function getStrongestCategory(
  categoryStats: Array<{ avgScore: number; category?: { name: string } | null }>
): Category {
  if (categoryStats.length === 0) {
    return "";
  }
  const sorted = [...categoryStats].sort((a, b) => b.avgScore - a.avgScore);
  return sorted[0]?.category?.name || "";
}

function getRankedSubmissions(
  submissions: readonly LeaderboardSubmission[],
  options: Pick<GetLeaderboardOptions, "categorySlug" | "period">,
  now: Date
): LeaderboardSubmission[] {
  return filterLeaderboardSubmissions(submissions, {
    categorySlug: options.categorySlug,
    now,
    period: options.period,
  });
}

function averageScore(submissions: readonly LeaderboardSubmission[]): number {
  const bestScores = new Map<string, number>();
  for (const submission of submissions) {
    const score = submission.totalScore ?? 0;
    const bestScore = bestScores.get(submission.challengeId) ?? 0;
    if (score > bestScore) {
      bestScores.set(submission.challengeId, score);
    }
  }
  if (bestScores.size === 0) {
    return 0;
  }
  return Math.round(
    [...bestScores.values()].reduce((sum, score) => sum + score, 0) /
      bestScores.size
  );
}

function compareLeaderboardEntries(
  left: Pick<LeaderboardEntry, "avgScore" | "score" | "solved" | "userId">,
  right: Pick<LeaderboardEntry, "avgScore" | "score" | "solved" | "userId">
): number {
  return (
    right.score - left.score ||
    right.solved - left.solved ||
    right.avgScore - left.avgScore ||
    (left.userId ?? "").localeCompare(right.userId ?? "")
  );
}

export function buildUserLeaderboardEntry(
  user: UserWithSubmissionsAndStats,
  rank: number,
  options: Pick<GetLeaderboardOptions, "categorySlug" | "period"> = {},
  now = new Date()
): LeaderboardEntry {
  const submissions = getRankedSubmissions(user.submissions, options, now);
  return {
    avgScore: averageScore(submissions),
    name: user.displayName || user.name || "Anonymous",
    rank,
    score: calcPoints(submissions),
    solved: countSolvedChallenges(submissions),
    streak: user.streakCount,
    strongest: options.categorySlug
      ? submissions[0]?.challenge?.category?.name || ""
      : getStrongestCategory(user.categoryStats),
    userId: user.id,
  };
}

export function createLeaderboardService(
  repo: LeaderboardRepository = leaderboardRepository
) {
  async function calculateUserRank(
    userId: string,
    options: Pick<GetLeaderboardOptions, "categorySlug" | "period"> = {},
    now = new Date()
  ): Promise<string> {
    const users = await repo.findAllUsersWithSubmissions();
    const entries = users
      .map((user) => {
        const submissions = getRankedSubmissions(
          user.submissions,
          options,
          now
        );
        return {
          avgScore: averageScore(submissions),
          score: calcPoints(submissions),
          solved: countSolvedChallenges(submissions),
          userId: user.id,
        };
      })
      .filter((entry) => entry.score > 0 || entry.solved > 0)
      .sort(compareLeaderboardEntries);
    const idx = entries.findIndex((entry) => entry.userId === userId);
    return idx >= 0 ? `#${idx + 1}` : "#--";
  }

  async function fetchDbLeaderboard(
    options: Pick<GetLeaderboardOptions, "categorySlug" | "period">,
    limit: number,
    now: Date
  ): Promise<LeaderboardEntry[]> {
    const users = await repo.findAllWithCategoryStats();
    return users
      .map((user) =>
        buildUserLeaderboardEntry(
          user as UserWithSubmissionsAndStats,
          0,
          options,
          now
        )
      )
      .filter((entry) => entry.score > 0 || entry.solved > 0)
      .sort(compareLeaderboardEntries)
      .slice(0, limit)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
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
    const rankingOptions = { categorySlug, period };
    const now = new Date();
    const cacheKey = getLeaderboardCacheKey(period, categorySlug, limit);
    const cached = await getCachedLeaderboard(cacheKey);

    let entries = cached;
    if (!entries) {
      entries = await fetchDbLeaderboard(rankingOptions, limit, now);
      await setCachedLeaderboard(cacheKey, entries);
    }

    const entriesWithUserFlag = entries.map((entry) => ({
      ...entry,
      isUser: Boolean(currentUserId && entry.userId === currentUserId),
    }));

    if (currentUserId && !entriesWithUserFlag.some((entry) => entry.isUser)) {
      const currentUser = await repo.findByIdWithRelations(currentUserId);
      if (currentUser?.role !== "user" || currentUser.banned) {
        return entriesWithUserFlag;
      }
      const currentUserEntry = buildUserLeaderboardEntry(
        currentUser,
        0,
        rankingOptions,
        now
      );
      if (currentUserEntry.score === 0 && currentUserEntry.solved === 0) {
        return entriesWithUserFlag;
      }
      const userRank = await calculateUserRank(
        currentUserId,
        rankingOptions,
        now
      );
      const rank = Number.parseInt(userRank.slice(1), 10) || entries.length + 1;
      entriesWithUserFlag.push({
        ...currentUserEntry,
        isUser: true,
        rank,
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
