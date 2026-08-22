import { type PgSelect } from "drizzle-orm/pg-core";
import { eq, desc, lt, sql, and } from "drizzle-orm";
import { db } from "./client";
import { challenges, leaderboardEntries, submissions } from "./schema";

/**
 * 1. Offset/Limit Pagination
 * Best for: Admin dashboards, Leaderboards (where users want to jump to a specific page).
 */
export function withOffsetPagination<T extends PgSelect>(
  qb: T,
  page: number = 1,
  limit: number = 20,
) {
  const offset = (page - 1) * limit;
  return qb.limit(limit).offset(offset);
}

/**
 * 2. Cursor-Based Pagination (Performance Optimized)
 * Best for: Infinite scrolling, feeds, large datasets (Submissions, Notifications).
 * 
 * @param cursor - The 'createdAt' timestamp of the last item in the previous page
 */
export function withCursorPagination<T extends PgSelect>(
  qb: T,
  cursorColumn: any,
  cursorValue?: Date,
  limit: number = 20,
) {
  let query = qb.limit(limit);
  if (cursorValue) {
    // Assuming descending order (newest first)
    query = query.where(lt(cursorColumn, cursorValue)) as T;
  }
  return query;
}

/**
 * Example: Offset Pagination (Leaderboards)
 */
export async function getPaginatedLeaderboard(page: number, limit: number) {
  let query = db.select()
    .from(leaderboardEntries)
    .orderBy(desc(leaderboardEntries.totalScore))
    .$dynamic();

  return await withOffsetPagination(query, page, limit);
}

/**
 * Example: Cursor Pagination (Recent Submissions Feed)
 */
export async function getRecentSubmissionsFeed(userId: string, cursor?: Date, limit: number = 20) {
  let query = db.select()
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt))
    .$dynamic();

  // Apply cursor helper filtering by createdAt
  query = withCursorPagination(query, submissions.createdAt, cursor, limit);

  return await query;
}
