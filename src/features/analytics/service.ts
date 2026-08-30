import { count } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { analyticsRepository } from "./repository";
import type { AnalyticsOverview, AnalyticsRepository } from "./types";

export function createAnalyticsService(
  repo: AnalyticsRepository = analyticsRepository
) {
  async function getOverview(): Promise<AnalyticsOverview> {
    const [
      totalUsers,
      challengesByStatus,
      submissionsByDay,
      solveRate,
      avgScorePerCategory,
      topCategories,
    ] = await Promise.all([
      repo.countUsers(),
      repo.countChallengesByStatus(),
      repo.countSubmissionsByDay(30),
      repo.getSolveRate(),
      repo.avgScorePerCategory(),
      repo.topCategories(5),
    ]);

    const totalChallenges = challengesByStatus.reduce(
      (sum, r) => sum + r.count,
      0
    );
    const totalSubmissions = solveRate.total;

    return {
      avgScorePerCategory,
      challengesByStatus,
      solveRate,
      submissionsByDay,
      topCategories,
      totalChallenges,
      totalSubmissions,
      totalUsers,
    };
  }

  async function getTotalSubmissions(): Promise<number> {
    const [row] = await db.select({ value: count() }).from(schema.submissions);
    return row?.value ?? 0;
  }

  return {
    getOverview,
    getTotalSubmissions,
  };
}

export const analyticsService = createAnalyticsService(analyticsRepository);
