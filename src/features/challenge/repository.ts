import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

// --- Inferred row types (no `any`, sourced from Drizzle schema) ---
type ChallengeRow = typeof schema.challenges.$inferSelect;
type HintRow = typeof schema.hints.$inferSelect;
type SubmissionRow = typeof schema.submissions.$inferSelect;
type CategoryRow = typeof schema.categories.$inferSelect;
type UserRow = typeof schema.users.$inferSelect;

// --- Thin DTOs (field selection only; no business logic) ---

export interface PublishedChallengeDTO {
  buggyArtifact: ChallengeRow["buggyArtifact"];
  categoryId: ChallengeRow["categoryId"];
  categoryName: CategoryRow["name"];
  categorySlug: CategoryRow["slug"];
  createdAt: ChallengeRow["createdAt"];
  difficulty: ChallengeRow["difficulty"];
  format: ChallengeRow["format"];
  hints: HintRow[];
  id: ChallengeRow["id"];
  preventionNotes: ChallengeRow["preventionNotes"];
  prompt: ChallengeRow["prompt"];
  referenceFix: ChallengeRow["referenceFix"];
  rootCauseSummary: ChallengeRow["rootCauseSummary"];
  status: ChallengeRow["status"];
  submissions: SubmissionRow[];
  title: ChallengeRow["title"];
}

export interface ChallengeDetailDTO {
  buggyArtifact: ChallengeRow["buggyArtifact"];
  categoryId: ChallengeRow["categoryId"];
  categoryName: CategoryRow["name"];
  categorySlug: CategoryRow["slug"];
  createdAt: ChallengeRow["createdAt"];
  difficulty: ChallengeRow["difficulty"];
  format: ChallengeRow["format"];
  hints: HintRow[];
  id: ChallengeRow["id"];
  preventionNotes: ChallengeRow["preventionNotes"];
  prompt: ChallengeRow["prompt"];
  referenceFix: ChallengeRow["referenceFix"];
  rootCauseSummary: ChallengeRow["rootCauseSummary"];
  status: ChallengeRow["status"];
  title: ChallengeRow["title"];
}

export type SubmissionWithRelations = SubmissionRow & {
  challenge: ChallengeRow & { category: CategoryRow };
  user: UserRow;
};

export interface UserChallengeStatsData {
  totalPublishedCount: number;
  user: (UserRow & { submissions: SubmissionRow[] }) | null;
}

// --- Repository interface (functional, no class) ---
export interface ChallengeRepository {
  findPublished: () => Promise<PublishedChallengeDTO[]>;
  findById: (id: string) => Promise<ChallengeDetailDTO | null>;
  findChallengeByIdForDetail: (
    id: string
  ) => Promise<(ChallengeDetailDTO & { submissions: SubmissionRow[] }) | null>;
  findSubmissionById: (id: string) => Promise<SubmissionWithRelations | null>;
  insertSubmission: (
    data: typeof schema.submissions.$inferInsert
  ) => Promise<SubmissionRow>;
  findHintsByChallengeId: (id: string) => Promise<HintRow[]>;
  findUserChallengeStatsData: (userId: string) => Promise<UserChallengeStatsData>;
}

export const challengeRepository: ChallengeRepository = {
  async findPublished() {
    const challengesList = await db.query.challenges.findMany({
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
  },

  async findById(challengeId: string) {
    const challenge = await db.query.challenges.findFirst({
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
  },

  async findChallengeByIdForDetail(challengeId: string) {
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

    if (!challenge) {
      return null;
    }

    return {
      buggyArtifact: challenge.buggyArtifact,
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
  },

  async findSubmissionById(submissionId: string) {
    const submission = await db.query.submissions.findFirst({
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
  },

  async insertSubmission(data) {
    const [inserted] = await db
      .insert(schema.submissions)
      .values(data)
      .returning();

    return inserted;
  },

  async findHintsByChallengeId(challengeId: string) {
    const hintsList = await db.query.hints.findMany({
      where: eq(schema.hints.challengeId, challengeId),
      orderBy: [asc(schema.hints.order)],
    });

    return hintsList;
  },

  async findUserChallengeStatsData(userId: string) {
    const totalPublished = await db.query.challenges.findMany({
      columns: { id: true },
      where: eq(schema.challenges.status, "published"),
    });
    const totalPublishedCount = totalPublished.length;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        submissions: true,
      },
    });

    return {
      totalPublishedCount,
      user: user ?? null,
    };
  },
};
