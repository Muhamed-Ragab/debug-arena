import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { calculateUserRank } from "@/features/leaderboard/queries";

export async function getPublishedChallenges() {
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
}

export interface UserChallengeStats {
  rank: string;
  solvedRatio: string;
  streak: string;
}

export async function getUserChallengeStats(
  userId?: string | null
): Promise<UserChallengeStats> {
  const totalPublished = await db.query.challenges.findMany({
    columns: { id: true },
    where: eq(schema.challenges.status, "published"),
  });
  const totalCount = totalPublished.length;

  if (!userId) {
    return {
      rank: "#--",
      solvedRatio: `0 / ${totalCount}`,
      streak: "0 days",
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    with: {
      submissions: true,
    },
  });

  if (!user) {
    return {
      rank: "#--",
      solvedRatio: `0 / ${totalCount}`,
      streak: "0 days",
    };
  }

  // Count unique solved challenges
  const solvedChallengeIds = new Set(
    user.submissions
      .filter((s) => s.fixCorrect || (s.totalScore ?? 0) >= 60)
      .map((s) => s.challengeId)
  );

  const rank = await calculateUserRank(userId);

  return {
    rank,
    solvedRatio: `${solvedChallengeIds.size} / ${totalCount}`,
    streak: `${user.streakCount} ${user.streakCount === 1 ? "day" : "days"}`,
  };
}

export async function getChallengeById(challengeId: string) {
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
}

export async function getSubmissionById(submissionId: string) {
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

  return {
    canonicalPreventionNotes: submission.challenge.preventionNotes,
    canonicalRootCause: submission.challenge.rootCauseSummary,
    categoryName: submission.challenge.category.name,
    challengeDifficulty: submission.challenge.difficulty,
    challengeId: submission.challengeId,
    challengeTitle: submission.challenge.title,
    createdAt: submission.createdAt,
    fixCorrect: submission.fixCorrect,
    hintsUsed: submission.hintsUsed,
    id: submission.id,
    localizationAnswer: submission.localizationAnswer,
    localizationCorrect: submission.localizationCorrect,
    preventionAnswer: submission.preventionAnswer,
    preventionScore: submission.preventionScore,
    proposedFix: submission.proposedFix,
    referenceFix: submission.challenge.referenceFix,
    rootCauseExplanation: submission.rootCauseExplanation,
    rootCauseScore: submission.rootCauseScore,
    timeSpentSeconds: submission.timeSpentSeconds,
    totalScore: submission.totalScore,
    user: submission.user,
    userId: submission.userId,
  };
}
