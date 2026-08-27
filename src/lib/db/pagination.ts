import { gt, type SQL } from "drizzle-orm";
import type { PgColumn, PgSelect } from "drizzle-orm/pg-core";

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface CursorPaginationParams<TValue = string | number> {
  cursor?: TValue | null;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Dynamic query builder helper for limit-offset pagination.
 * Reference: https://orm.drizzle.team/docs/guides/limit-offset-pagination & https://orm.drizzle.team/docs/dynamic-query-building
 */
export function withPagination<T extends PgSelect>(
  qb: T,
  page = 1,
  pageSize = 10
): T {
  const normalizedPage = Math.max(1, page);
  const normalizedPageSize = Math.max(1, pageSize);
  const offset = (normalizedPage - 1) * normalizedPageSize;

  return qb.limit(normalizedPageSize).offset(offset) as T;
}

/**
 * Dynamic query builder helper for cursor-based pagination.
 * Reference: https://orm.drizzle.team/docs/guides/cursor-based-pagination
 */
export function withCursor<T extends PgSelect>(
  qb: T,
  cursorColumn: PgColumn,
  cursor?: string | number | null,
  limit = 10
): T {
  const normalizedLimit = Math.max(1, limit);
  if (cursor !== undefined && cursor !== null) {
    return (qb as unknown as { where: (clause: SQL) => T })
      .where(gt(cursorColumn, cursor))
      .limit(normalizedLimit) as T;
  }
  return qb.limit(normalizedLimit) as T;
}

/**
 * Calculate total pages utility
 */
export function calculateTotalPages(
  totalCount: number,
  pageSize: number
): number {
  return Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
}
