import "server-only";

import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { OFFLINE_MESSAGE, toOfflineError } from "@/lib/offline";
import { ConflictError } from "@/lib/safe-action/errors";
import type {
  ChallengeDetailDTO,
  ChallengeRepository,
  FindPublishedChallengesPaginatedOpts,
  HintRow,
  PublishedChallengeDTO,
  SubmissionRow,
  SubmissionWithRelations,
  UserChallengeStatsData,
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
  console.warn(`[challengeRepository.${context}] DB error:`, err);
  throw toOfflineError(err, OFFLINE_MESSAGE);
}

export function createChallengeRepository(
  dbClient: typeof db = db
): ChallengeRepository {
  async function findById(
    challengeId: string
  ): Promise<ChallengeDetailDTO | null> {
    try {
      const challenge = await dbClient.query.challenges.findFirst({
        where: eq(schema.challenges.id, challengeId),
        with: {
          category: true,
          hints: {
            orderBy: [asc(schema.hints.order)],
          },
        },
      });

      if (!challenge) {
        return null;
      }

      return {
        buggyArtifact: challenge.buggyArtifact,
        categoryColor: challenge.category.color,
        categoryIcon: challenge.category.icon,
        categoryId: challenge.categoryId,
        categoryName: challenge.category.name,
        categorySlug: challenge.category.slug,
        createdAt: challenge.createdAt,
        difficulty: challenge.difficulty,
        format: challenge.format,
        hints: challenge.hints,
        id: challenge.id,
        preventionNotes: challenge.preventionNotes,
        prompt: challenge.prompt,
        referenceFix: challenge.referenceFix,
        rootCauseSummary: challenge.rootCauseSummary,
        status: challenge.status,
        title: challenge.title,
      };
    } catch (err) {
      handleDbError(err, "findById");
    }
  }

  async function findChallengeByIdForDetail(
    challengeId: string
  ): Promise<(ChallengeDetailDTO & { submissions: SubmissionRow[] }) | null> {
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

      if (!challenge) {
        return null;
      }

      return {
        buggyArtifact: challenge.buggyArtifact,
        categoryColor: challenge.category.color,
        categoryIcon: challenge.category.icon,
        categoryId: challenge.categoryId,
        categoryName: challenge.category.name,
        categorySlug: challenge.category.slug,
        createdAt: challenge.createdAt,
        difficulty: challenge.difficulty,
        format: challenge.format,
        hints: challenge.hints,
        id: challenge.id,
        preventionNotes: challenge.preventionNotes,
        prompt: challenge.prompt,
        referenceFix: challenge.referenceFix,
        rootCauseSummary: challenge.rootCauseSummary,
        status: challenge.status,
        submissions: challenge.submissions,
        title: challenge.title,
      };
    } catch (err) {
      handleDbError(err, "findChallengeByIdForDetail");
    }
  }

  async function findHintsByChallengeId(
    challengeId: string
  ): Promise<HintRow[]> {
    try {
      const hintsList = await dbClient.query.hints.findMany({
        orderBy: [asc(schema.hints.order)],
        where: eq(schema.hints.challengeId, challengeId),
      });

      return hintsList;
    } catch (err) {
      handleDbError(err, "findHintsByChallengeId");
    }
  }

  async function findPublished(): Promise<PublishedChallengeDTO[]> {
    try {
      const challengesList = await dbClient.query.challenges.findMany({
        orderBy: [desc(schema.challenges.createdAt)],
        where: eq(schema.challenges.status, "published"),
        with: {
          category: true,
          hints: {
            orderBy: [asc(schema.hints.order)],
          },
          submissions: true,
        },
      });

      return challengesList.map((c) => ({
        buggyArtifact: c.buggyArtifact,
        categoryColor: c.category.color,
        categoryIcon: c.category.icon,
        categoryId: c.categoryId,
        categoryName: c.category.name,
        categorySlug: c.category.slug,
        createdAt: c.createdAt,
        difficulty: c.difficulty,
        format: c.format,
        hints: c.hints,
        id: c.id,
        preventionNotes: c.preventionNotes,
        prompt: c.prompt,
        referenceFix: c.referenceFix,
        rootCauseSummary: c.rootCauseSummary,
        status: c.status,
        submissions: c.submissions,
        title: c.title,
      }));
    } catch (err) {
      handleDbError(err, "findPublished");
    }
  }

  function escapeLike(input: string): string {
    return input.replace(/[%_\\]/g, "\\$&");
  }

  async function findPublishedPaginated(
    opts: FindPublishedChallengesPaginatedOpts
  ): Promise<{ rows: PublishedChallengeDTO[]; total: number }> {
    try {
      const { page, pageSize, search, category, difficulty } = opts;
      const trimmedSearch = search.trim();
      const conditions: SQL[] = [eq(schema.challenges.status, "published")];

      if (category !== "all") {
        const cat = await dbClient.query.categories.findFirst({
          columns: { id: true },
          where: or(
            eq(schema.categories.slug, category),
            eq(schema.categories.name, category)
          ),
        });
        if (cat) {
          conditions.push(eq(schema.challenges.categoryId, cat.id));
        } else {
          return { rows: [], total: 0 };
        }
      }

      if (difficulty !== "all") {
        const normalized = difficulty.toLowerCase() as
          | "easy"
          | "medium"
          | "hard";
        if (["easy", "medium", "hard"].includes(normalized)) {
          conditions.push(eq(schema.challenges.difficulty, normalized));
        }
      }

      if (trimmedSearch) {
        const escaped = escapeLike(trimmedSearch);
        const pattern = `%${escaped}%`;
        conditions.push(ilike(schema.challenges.title, pattern));
      }

      const whereClause = and(...conditions);

      const countResult = await dbClient
        .select({ cnt: count() })
        .from(schema.challenges)
        .where(whereClause);
      const total = Number(countResult[0]?.cnt ?? 0);

      if (total === 0) {
        return { rows: [], total: 0 };
      }

      const offset = (page - 1) * pageSize;

      const rowsRaw = await dbClient.query.challenges.findMany({
        limit: pageSize,
        offset,
        orderBy: [desc(schema.challenges.createdAt)],
        where: whereClause,
        with: {
          category: true,
          hints: {
            orderBy: [asc(schema.hints.order)],
          },
          submissions: true,
        },
      });

      const rows: PublishedChallengeDTO[] = rowsRaw.map((c) => ({
        buggyArtifact: c.buggyArtifact,
        categoryColor: c.category.color,
        categoryIcon: c.category.icon,
        categoryId: c.categoryId,
        categoryName: c.category.name,
        categorySlug: c.category.slug,
        createdAt: c.createdAt,
        difficulty: c.difficulty,
        format: c.format,
        hints: c.hints,
        id: c.id,
        preventionNotes: c.preventionNotes,
        prompt: c.prompt,
        referenceFix: c.referenceFix,
        rootCauseSummary: c.rootCauseSummary,
        status: c.status,
        submissions: c.submissions,
        title: c.title,
      }));

      return { rows, total };
    } catch (err) {
      handleDbError(err, "findPublishedPaginated");
    }
  }

  async function findSubmissionById(
    submissionId: string
  ): Promise<SubmissionWithRelations | null> {
    try {
      const submission = await dbClient.query.submissions.findFirst({
        where: eq(schema.submissions.id, submissionId),
        with: {
          challenge: {
            with: {
              category: true,
            },
          },
          user: true,
        },
      });

      if (!submission) {
        return null;
      }

      return submission;
    } catch (err) {
      handleDbError(err, "findSubmissionById");
    }
  }

  async function findUserChallengeStatsData(
    userId: string
  ): Promise<UserChallengeStatsData> {
    try {
      const totalPublished = await dbClient.query.challenges.findMany({
        columns: { id: true },
        where: eq(schema.challenges.status, "published"),
      });
      const totalPublishedCount = totalPublished.length;

      const user = await dbClient.query.users.findFirst({
        where: eq(schema.users.id, userId),
        with: {
          submissions: true,
        },
      });

      return {
        totalPublishedCount,
        user: user ?? null,
      };
    } catch (err) {
      handleDbError(err, "findUserChallengeStatsData");
    }
  }

  async function insertSubmission(
    data: typeof schema.submissions.$inferInsert
  ): Promise<SubmissionRow> {
    try {
      const [inserted] = await dbClient
        .insert(schema.submissions)
        .values(data)
        .returning();

      return inserted;
    } catch (err) {
      handleDbError(err, "insertSubmission");
    }
  }

  return {
    findById,
    findChallengeByIdForDetail,
    findHintsByChallengeId,
    findPublished,
    findPublishedPaginated,
    findSubmissionById,
    findUserChallengeStatsData,
    insertSubmission,
  };
}

export const challengeRepository = createChallengeRepository();
