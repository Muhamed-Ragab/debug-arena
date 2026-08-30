import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
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
    insertChallenge,
    insertHints,
    updateChallenge,
    updateUserBanStatus,
    upsertEmbedding,
  };
}

export const adminRepository = createAdminRepository();

export type { ChallengeRow as ChallengeEmbeddingRow } from "./types";
