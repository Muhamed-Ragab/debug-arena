import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

// --- Inferred row types (no `any`, sourced from Drizzle schema) ---
type ChallengeRow = typeof schema.challenges.$inferSelect;
type HintRow = typeof schema.hints.$inferSelect;
type SubmissionRow = typeof schema.submissions.$inferSelect;
type CategoryRow = typeof schema.categories.$inferSelect;
type ChallengeEmbeddingRow = typeof schema.challengeEmbeddings.$inferSelect;

// --- Thin relation shapes (raw rows only; no business logic) ---
type AdminChallengeRow = ChallengeRow & {
  category: CategoryRow;
  hints: HintRow[];
  submissions: SubmissionRow[];
};

type AdminChallengeDetailRow = ChallengeRow & {
  category: CategoryRow;
  hints: HintRow[];
  submissions: SubmissionRow[];
};

// --- Repository interface (functional, no class) ---
export interface AdminRepository {
  deleteChallengeCascade: (challengeId: string) => Promise<void>;
  deleteHintsByChallengeId: (challengeId: string) => Promise<void>;
  findCategories: () => Promise<CategoryRow[]>;
  findChallengeById: (id: string) => Promise<AdminChallengeDetailRow | null>;
  findChallenges: () => Promise<AdminChallengeRow[]>;
  insertChallenge: (
    data: typeof schema.challenges.$inferInsert
  ) => Promise<ChallengeRow>;
  insertHints: (hints: (typeof schema.hints.$inferInsert)[]) => Promise<void>;
  updateChallenge: (
    id: string,
    data: Partial<typeof schema.challenges.$inferInsert>
  ) => Promise<void>;
  upsertEmbedding: (
    challengeId: string,
    content: string,
    embedding: (typeof schema.challengeEmbeddings.$inferInsert)["embedding"]
  ) => Promise<void>;
}

export const adminRepository: AdminRepository = {
  async deleteChallengeCascade(challengeId: string) {
    // Manual cascade order: hints -> embeddings -> submissions -> challenges.
    // No FK cascade is configured, so ordering must be explicit.
    await db
      .delete(schema.hints)
      .where(eq(schema.hints.challengeId, challengeId));

    await db
      .delete(schema.challengeEmbeddings)
      .where(eq(schema.challengeEmbeddings.challengeId, challengeId));

    await db
      .delete(schema.submissions)
      .where(eq(schema.submissions.challengeId, challengeId));

    await db
      .delete(schema.challenges)
      .where(eq(schema.challenges.id, challengeId));
  },

  async deleteHintsByChallengeId(challengeId: string) {
    await db
      .delete(schema.hints)
      .where(eq(schema.hints.challengeId, challengeId));
  },
  async findCategories() {
    return await db.query.categories.findMany({
      orderBy: [asc(schema.categories.name)],
    });
  },

  async findChallengeById(challengeId: string) {
    const challenge = await db.query.challenges.findFirst({
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
  },

  async findChallenges() {
    return await db.query.challenges.findMany({
      orderBy: [desc(schema.challenges.createdAt)],
      with: {
        category: true,
        hints: {
          orderBy: [asc(schema.hints.order)],
        },
        submissions: true,
      },
    });
  },

  async insertChallenge(data) {
    const [inserted] = await db
      .insert(schema.challenges)
      .values(data)
      .returning();

    return inserted;
  },

  async insertHints(hints) {
    if (hints.length === 0) {
      return;
    }

    await db.insert(schema.hints).values(hints);
  },

  async updateChallenge(id: string, data) {
    await db
      .update(schema.challenges)
      .set(data)
      .where(eq(schema.challenges.id, id));
  },

  async upsertEmbedding(challengeId: string, content: string, embedding) {
    await db
      .delete(schema.challengeEmbeddings)
      .where(eq(schema.challengeEmbeddings.challengeId, challengeId));

    await db.insert(schema.challengeEmbeddings).values({
      challengeId,
      content,
      embedding,
    });
  },
};

export type { ChallengeEmbeddingRow };
