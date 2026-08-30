import "server-only";

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { OFFLINE_MESSAGE, toOfflineError } from "@/lib/offline";
import { ConflictError } from "@/lib/safe-action/errors";
import type { AnalyticsRepository } from "./types";

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
  console.warn(`[analyticsRepository.${context}] DB error:`, err);
  throw toOfflineError(err, OFFLINE_MESSAGE);
}

export function createAnalyticsRepository(
  dbClient: typeof db = db
): AnalyticsRepository {
  async function countUsers(): Promise<number> {
    try {
      const [row] = await dbClient
        .select({ value: count() })
        .from(schema.users)
        .where(
          and(eq(schema.users.role, "user"), eq(schema.users.banned, false))
        );
      return row?.value ?? 0;
    } catch (err) {
      handleDbError(err, "countUsers");
    }
  }

  async function countChallengesByStatus(): Promise<
    Array<{ count: number; status: string }>
  > {
    try {
      const rows = await dbClient
        .select({
          count: count(),
          status: schema.challenges.status,
        })
        .from(schema.challenges)
        .groupBy(schema.challenges.status);
      return rows.map((r) => ({ count: r.count, status: r.status }));
    } catch (err) {
      handleDbError(err, "countChallengesByStatus");
    }
  }

  async function countSubmissionsByDay(
    days = 30
  ): Promise<Array<{ count: number; date: string }>> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const rows = await dbClient
        .select({
          count: count(),
          date: sql<string>`date_trunc('day', ${schema.submissions.createdAt})::date::text`,
        })
        .from(schema.submissions)
        .where(gte(schema.submissions.createdAt, since))
        .groupBy(sql`date_trunc('day', ${schema.submissions.createdAt})`)
        .orderBy(sql`date_trunc('day', ${schema.submissions.createdAt})`);
      return rows.map((r) => ({ count: r.count, date: r.date }));
    } catch (err) {
      handleDbError(err, "countSubmissionsByDay");
    }
  }

  async function getSolveRate(): Promise<{
    rate: number;
    solved: number;
    total: number;
  }> {
    try {
      const [totalRow] = await dbClient
        .select({ value: count() })
        .from(schema.submissions);
      const total = totalRow?.value ?? 0;
      if (total === 0) {
        return { rate: 0, solved: 0, total: 0 };
      }
      const [solvedRow] = await dbClient
        .select({ value: count() })
        .from(schema.submissions)
        .where(
          sql`${schema.submissions.fixCorrect} = true OR ${schema.submissions.totalScore} >= 60`
        );
      const solved = solvedRow?.value ?? 0;
      const rate = total > 0 ? Math.round((solved / total) * 100) : 0;
      return { rate, solved, total };
    } catch (err) {
      handleDbError(err, "getSolveRate");
    }
  }

  async function avgScorePerCategory(): Promise<
    Array<{
      avgScore: number;
      categoryId: string;
      categoryName: string;
      count: number;
    }>
  > {
    try {
      const rows = await dbClient
        .select({
          avgScore: sql<number>`avg(${schema.submissions.totalScore})::float`,
          categoryId: schema.challenges.categoryId,
          categoryName: schema.categories.name,
          count: count(),
        })
        .from(schema.submissions)
        .innerJoin(
          schema.challenges,
          eq(schema.submissions.challengeId, schema.challenges.id)
        )
        .innerJoin(
          schema.categories,
          eq(schema.challenges.categoryId, schema.categories.id)
        )
        .where(sql`${schema.submissions.totalScore} IS NOT NULL`)
        .groupBy(schema.challenges.categoryId, schema.categories.name);
      return rows.map((r) => ({
        avgScore: Math.round(r.avgScore ?? 0),
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        count: r.count,
      }));
    } catch (err) {
      handleDbError(err, "avgScorePerCategory");
    }
  }

  async function topCategories(
    limit = 5
  ): Promise<
    Array<{ attempts: number; categoryId: string; categoryName: string }>
  > {
    try {
      const rows = await dbClient
        .select({
          attempts: count(),
          categoryId: schema.challenges.categoryId,
          categoryName: schema.categories.name,
        })
        .from(schema.submissions)
        .innerJoin(
          schema.challenges,
          eq(schema.submissions.challengeId, schema.challenges.id)
        )
        .innerJoin(
          schema.categories,
          eq(schema.challenges.categoryId, schema.categories.id)
        )
        .groupBy(schema.challenges.categoryId, schema.categories.name)
        .orderBy(desc(count()))
        .limit(limit);
      return rows.map((r) => ({
        attempts: r.attempts,
        categoryId: r.categoryId,
        categoryName: r.categoryName,
      }));
    } catch (err) {
      handleDbError(err, "topCategories");
    }
  }

  return {
    avgScorePerCategory,
    countChallengesByStatus,
    countSubmissionsByDay,
    countUsers,
    getSolveRate,
    topCategories,
  };
}

export const analyticsRepository = createAnalyticsRepository();
