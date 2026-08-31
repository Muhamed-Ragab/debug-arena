import { count } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { analyticsRepository } from "./repository";
import type { AnalyticsOverview, AnalyticsRepository } from "./types";

export function createAnalyticsService(
  repo: AnalyticsRepository = analyticsRepository
) {
  async function getOverview(): Promise<AnalyticsOverview> {
    const settled = await Promise.allSettled([
      repo.countUsers(),
      repo.countChallengesByStatus(),
      repo.countSubmissionsByDay(30),
      repo.getSolveRate(),
      repo.avgScorePerCategory(),
      repo.topCategories(5),
    ]);

    const totalUsers = settled[0].status === "fulfilled" ? settled[0].value : 0;
    const challengesByStatus =
      settled[1].status === "fulfilled" ? settled[1].value : [];
    const submissionsByDay =
      settled[2].status === "fulfilled" ? settled[2].value : [];
    const solveRate =
      settled[3].status === "fulfilled"
        ? settled[3].value
        : { rate: 0, solved: 0, total: 0 };
    const avgScorePerCategory =
      settled[4].status === "fulfilled" ? settled[4].value : [];
    const topCategories =
      settled[5].status === "fulfilled" ? settled[5].value : [];

    for (const [idx, result] of settled.entries()) {
      if (result.status === "rejected") {
        console.warn(
          `[analyticsService.getOverview] query ${idx} failed:`,
          result.reason
        );
      }
    }

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
