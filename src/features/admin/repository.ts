import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { OFFLINE_MESSAGE, toOfflineError } from "@/lib/offline";
import { ConflictError } from "@/lib/safe-action/errors";
import type {
  AdminChallengeDetailRow,
  AdminChallengeRow,
  AdminRepository,
  CategoryRow,
  ChallengeRow,
  FindChallengesPaginatedOpts,
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
  console.warn(`[adminRepository.${context}] DB error:`, err);
  throw toOfflineError(err, OFFLINE_MESSAGE);
}

function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

function buildFilterConditions(
  opts: Pick<FindChallengesPaginatedOpts, "status" | "source" | "difficulty">
): SQL[] {
  const conditions: SQL[] = [];
  if (opts.status !== "all") {
    conditions.push(eq(schema.challenges.status, opts.status));
  }
  if (opts.source !== "all") {
    conditions.push(eq(schema.challenges.source, opts.source));
  }
  if (opts.difficulty !== "all") {
    conditions.push(eq(schema.challenges.difficulty, opts.difficulty));
  }
  return conditions;
}

function buildSearchCondition(
  pattern: string,
  categoryIds: string[]
): SQL | undefined {
  if (categoryIds.length > 0) {
    return or(
      ilike(schema.challenges.title, pattern),
      inArray(schema.challenges.categoryId, categoryIds)
    );
  }
  return ilike(schema.challenges.title, pattern);
}

function getOrderBy(
  sortBy: FindChallengesPaginatedOpts["sortBy"],
  sortOrder: FindChallengesPaginatedOpts["sortOrder"]
): SQL[] {
  if (sortBy === "title") {
    if (sortOrder === "asc") {
      return [asc(schema.challenges.title)];
    }
    return [desc(schema.challenges.title)];
  }
  if (sortOrder === "asc") {
    return [asc(schema.challenges.createdAt)];
  }
  return [desc(schema.challenges.createdAt)];
}

async function findMatchingCategoryIds(
  dbClient: typeof db,
  pattern: string
): Promise<string[]> {
  try {
    const matchingCategories = await dbClient.query.categories.findMany({
      columns: { id: true },
      where: ilike(schema.categories.name, pattern),
    });
    return matchingCategories.map((c) => c.id);
  } catch (err) {
    console.warn(
      "[adminRepository.findChallengesPaginated] category lookup failed, falling back to title-only search:",
      err
    );
    return [];
  }
}

export function createAdminRepository(
  dbClient: typeof db = db
): AdminRepository {
  async function findCategories(): Promise<CategoryRow[]> {
    try {
      return await dbClient.query.categories.findMany({
        orderBy: [asc(schema.categories.name)],
      });
    } catch (err) {
      handleDbError(err, "findCategories");
    }
  }

  async function findChallenges(): Promise<AdminChallengeRow[]> {
    try {
      return await dbClient.query.challenges.findMany({
        orderBy: [desc(schema.challenges.createdAt)],
        with: {
          category: true,
          hints: {
            orderBy: [asc(schema.hints.order)],
          },
          submissions: true,
        },
      });
    } catch (err) {
      handleDbError(err, "findChallenges");
    }
  }

  async function findChallengesPaginated(
    opts: FindChallengesPaginatedOpts
  ): Promise<{ rows: AdminChallengeRow[]; total: number }> {
    try {
      const {
        page,
        pageSize,
        search,
        status,
        source,
        difficulty,
        sortBy,
        sortOrder,
      } = opts;
      const trimmedSearch = search.trim();
      const conditions: SQL[] = buildFilterConditions({
        difficulty,
        source,
        status,
      });

      if (trimmedSearch) {
        const escaped = escapeLike(trimmedSearch);
        const pattern = `%${escaped}%`;
        const categoryIds = await findMatchingCategoryIds(dbClient, pattern);
        const searchCondition = buildSearchCondition(pattern, categoryIds);
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await dbClient
        .select({ cnt: count() })
        .from(schema.challenges)
        .where(whereClause);
      const total = Number(countResult[0]?.cnt ?? 0);

      const orderBy = getOrderBy(sortBy, sortOrder);

      const offset = (page - 1) * pageSize;

      const rows = await dbClient.query.challenges.findMany({
        limit: pageSize,
        offset,
        orderBy,
        where: whereClause,
        with: {
          category: true,
          hints: {
            orderBy: [asc(schema.hints.order)],
          },
          submissions: true,
        },
      });

      return { rows, total };
    } catch (err) {
      handleDbError(err, "findChallengesPaginated");
    }
  }

  async function findChallengeById(
    challengeId: string
  ): Promise<AdminChallengeDetailRow | null> {
    try {
      const challenge = await dbClient.query.challenges.findFirst({
        where: eq(schema.challenges.id, challengeId),
        with: {
          category: true,
          hints: {
            orderBy: [asc(schema.hints.order)],
          },
          submissions: true,
        },
      });

      return challenge ?? null;
    } catch (err) {
      handleDbError(err, "findChallengeById");
    }
  }

  async function insertChallenge(
    data: typeof schema.challenges.$inferInsert
  ): Promise<ChallengeRow> {
    try {
      const [inserted] = await dbClient
        .insert(schema.challenges)
        .values(data)
        .returning();

      return inserted;
    } catch (err) {
      handleDbError(err, "insertChallenge");
    }
  }

  async function updateChallenge(
    id: string,
    data: Partial<typeof schema.challenges.$inferInsert>
  ): Promise<void> {
    try {
      await dbClient
        .update(schema.challenges)
        .set(data)
        .where(eq(schema.challenges.id, id));
    } catch (err) {
      handleDbError(err, "updateChallenge");
    }
  }

  async function deleteHintsByChallengeId(challengeId: string): Promise<void> {
    try {
      await dbClient
        .delete(schema.hints)
        .where(eq(schema.hints.challengeId, challengeId));
    } catch (err) {
      handleDbError(err, "deleteHintsByChallengeId");
    }
  }

  async function insertHints(
    hints: (typeof schema.hints.$inferInsert)[]
  ): Promise<void> {
    if (hints.length === 0) {
      return;
    }

    try {
      await dbClient.insert(schema.hints).values(hints);
    } catch (err) {
      handleDbError(err, "insertHints");
    }
  }

  async function upsertEmbedding(
    challengeId: string,
    content: string,
    embedding: (typeof schema.challengeEmbeddings.$inferInsert)["embedding"]
  ): Promise<void> {
    try {
      await dbClient
        .delete(schema.challengeEmbeddings)
        .where(eq(schema.challengeEmbeddings.challengeId, challengeId));

      await dbClient.insert(schema.challengeEmbeddings).values({
        challengeId,
        content,
        embedding,
      });
    } catch (err) {
      handleDbError(err, "upsertEmbedding");
    }
  }

  async function deleteChallengeCascade(challengeId: string): Promise<void> {
    try {
      await dbClient.transaction(async (tx) => {
        await tx
          .delete(schema.hints)
          .where(eq(schema.hints.challengeId, challengeId));

        await tx
          .delete(schema.challengeEmbeddings)
          .where(eq(schema.challengeEmbeddings.challengeId, challengeId));

        await tx
          .delete(schema.submissions)
          .where(eq(schema.submissions.challengeId, challengeId));

        await tx
          .delete(schema.challenges)
          .where(eq(schema.challenges.id, challengeId));
      });
    } catch (err) {
      // Preserve ConflictError / not masked as offline
      if (err instanceof ConflictError) {
        throw err;
      }
      const { code } = err as { code?: string };
      if (code === "23505" || code === "23503") {
        throw new ConflictError(
          "Constraint violation in deleteChallengeCascade",
          {
            cause: err,
          }
        );
      }
      console.warn("[adminRepository.deleteChallengeCascade] DB error:", err);
      throw toOfflineError(err, OFFLINE_MESSAGE);
    }
  }

  async function getChallengeStats(): Promise<{
    aiGenerated: number;
    draft: number;
    published: number;
    total: number;
  }> {
    try {
      const [totalRes, aiRes, pubRes, draftRes] = await Promise.all([
        dbClient.select({ cnt: count() }).from(schema.challenges),
        dbClient
          .select({ cnt: count() })
          .from(schema.challenges)
          .where(eq(schema.challenges.source, "ai_generated")),
        dbClient
          .select({ cnt: count() })
          .from(schema.challenges)
          .where(eq(schema.challenges.status, "published")),
        dbClient
          .select({ cnt: count() })
          .from(schema.challenges)
          .where(eq(schema.challenges.status, "draft")),
      ]);
      return {
        aiGenerated: Number(aiRes[0]?.cnt ?? 0),
        draft: Number(draftRes[0]?.cnt ?? 0),
        published: Number(pubRes[0]?.cnt ?? 0),
        total: Number(totalRes[0]?.cnt ?? 0),
      };
    } catch (err) {
      handleDbError(err, "getChallengeStats");
    }
  }

  async function findAllUsers(): Promise<(typeof schema.users.$inferSelect)[]> {
    try {
      return await dbClient.query.users.findMany({
        orderBy: [desc(schema.users.createdAt)],
        where: and(eq(schema.users.role, "user")),
      });
    } catch (err) {
      handleDbError(err, "findAllUsers");
    }
  }

  async function updateUserBanStatus(
    userId: string,
    banned: boolean
  ): Promise<void> {
    try {
      await dbClient
        .update(schema.users)
        .set({ banned })
        .where(eq(schema.users.id, userId));
    } catch (err) {
      handleDbError(err, "updateUserBanStatus");
    }
  }

  return {
    deleteChallengeCascade,
    deleteHintsByChallengeId,
    findAllUsers,
    findCategories,
    findChallengeById,
    findChallenges,
    findChallengesPaginated,
    getChallengeStats,
    insertChallenge,
    insertHints,
    updateChallenge,
    updateUserBanStatus,
    upsertEmbedding,
  };
}

export const adminRepository = createAdminRepository();

export type { ChallengeRow as ChallengeEmbeddingRow } from "./types";
